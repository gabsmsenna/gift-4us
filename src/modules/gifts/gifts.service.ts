
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Gift } from "./entities/gift.entity";
import { User } from "../users/entities/user.entity";
import { UserEvent } from "../events/entities/user-event.entity";
import { EventType } from "src/util/event.enum";
import { CreateGiftDto } from "./dtos/create-gift.dto";
import { EventParticipant } from "../events/entities/event-participant.entity";
import { Match } from "../groups/entities/match.entity";
import { REDIS_CLIENT } from 'src/infra/redis/redis.module';
import Redis from 'ioredis';
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class GiftsService {
  private readonly logger = new Logger(GiftsService.name);
  private readonly CACHE_PREFIX = "gifts:event";

  constructor(
    @InjectRepository(Gift)
    private readonly giftRepository: Repository<Gift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(EventParticipant)
    private readonly eventParticipantRepository: Repository<EventParticipant>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @Inject("RABBITMQ_SERVICE") private readonly rmqClient: ClientProxy,
  ) { }

  async create(createGiftDto: CreateGiftDto, userId: string) {
    const { title, urls, eventIds } = createGiftDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException("Usuário não encontrado");
    }

    const events = await this.userEventRepository.find({
      where: { id: In(eventIds) },
    });

    if (events.length === 0) {
      throw new BadRequestException("Nenhum evento válido encontrado");
    }

    if (events.length !== eventIds.length) {
      throw new BadRequestException("Um ou mais eventos não foram encontrados");
    }

    // Validação: para eventos SECRET_FRIEND, verifica se o usuário é participante
    // Para eventos REGULAR, verifica se o usuário é o dono do evento
    for (const event of events) {
      if (event.eventType === EventType.SECRET_FRIEND) {
        // Para SECRET_FRIEND: o usuário deve ser participante do evento
        const isParticipant = await this.eventParticipantRepository.findOne({
          where: { eventId: event.id, userId },
        });

        if (!isParticipant) {
          throw new ForbiddenException(
            `Usuário não é participante do evento ${event.title}. Apenas participantes podem cadastrar sugestões de presentes.`,
          );
        }
      } else {
        // Para REGULAR: o usuário deve ser o dono do evento
        if (event.userId !== userId) {
          throw new ForbiddenException(
            `Apenas o dono do evento ${event.title} pode cadastrar presentes.`,
          );
        }
      }
    }

    const gift = this.giftRepository.create({
      title,
      urls,
      user,
      events,
    });

    const savedGift = await this.giftRepository.save(gift);

    const eventsId = events.map((e) => e.id);

    this.rmqClient.emit("cache.invalidate.gifts", {
      eventIds,
      trigger: "GIFT_CREATED",
      giftId: savedGift.id,
    });

    this.logger.log(
      `Invalidation event triggered for ${eventsId.length} events`,
    );

    return {
      id: savedGift.id,
      title: savedGift.title,
      urls: savedGift.urls,
      userId: user.id,
      userName: user.name,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        eventType: event.eventType,
      })),
      createdAt: savedGift.createdAt,
    };
  }

  async findByEvent(eventId: string, requestingUserId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:${eventId}:user:${requestingUserId}`;

    const cachedData = await this.redisClient.get(cacheKey);

    if (cachedData) {
      this.logger.debug(`Cache HIT for key : ${cacheKey}`);
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        this.logger.warn(`Failed to parse cached data for key ${cacheKey}, returning invalid cache? No, retrying DB.`);
        // If parse fails, treat as miss
      }
    }

    this.logger.debug(
      `Cache MISS for key ${cacheKey}. Searching on Postgres...`,
    );

    const event = await this.userEventRepository.findOne({
      where: { id: eventId },
      relations: ["groups"],
    });

    if (!event) {
      throw new BadRequestException("Evento não encontrado");
    }

    // Se for evento SECRET_FRIEND, aplica regra de permissão
    if (event.eventType === EventType.SECRET_FRIEND) {
      if (!event.groups || event.groups.length === 0) {
        throw new BadRequestException(
          "Evento não possui grupos associados. Não é possível buscar presentes.",
        );
      }

      // Busca o match onde o requestingUserId é o giver e está relacionado ao grupo do evento
      const groupIds = event.groups.map((group) => group.id);
      const match = await this.matchRepository.findOne({
        where: {
          giverId: requestingUserId,
          groupId: In(groupIds),
        },
        relations: ["receiver"],
      });

      if (!match) {
        throw new ForbiddenException(
          "Você não possui um amigo secreto atribuído neste evento",
        );
      }

      // Busca os presentes associados ao evento que pertencem ao receiver
      const gifts = await this.giftRepository
        .createQueryBuilder("gift")
        .innerJoin("gift.events", "event", "event.id = :eventId", { eventId })
        .leftJoinAndSelect("gift.user", "user")
        .where("gift.user_id = :receiverId", { receiverId: match.receiverId })
        .getMany();

      const result = {
        eventId: event.id,
        eventTitle: event.title,
        eventType: event.eventType,
        receiverId: match.receiverId,
        receiverName: match.receiver?.name || "",
        gifts: gifts.map((gift) => ({
          id: gift.id,
          title: gift.title,
          urls: gift.urls,
          userId: gift.user.id,
          userName: gift.user.name,
          createdAt: gift.createdAt,
        })),
      };

      // Salva no cache
      try {
        await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 7200);
        this.logger.debug(`Cache SET successfully for key: ${cacheKey}`);
      } catch (e) {
        this.logger.error(`Failed to SET cache for key ${cacheKey}: ${e.message}`);
      }

      return result;
    }

    // Para eventos REGULAR, retorna todos os presentes do evento
    const gifts = await this.giftRepository
      .createQueryBuilder("gift")
      .innerJoin("gift.events", "event", "event.id = :eventId", { eventId })
      .leftJoinAndSelect("gift.user", "user")
      .getMany();

    const result = {
      eventId: event.id,
      eventTitle: event.title,
      eventType: event.eventType,
      gifts: gifts.map((gift) => ({
        id: gift.id,
        title: gift.title,
        urls: gift.urls,
        userId: gift.user.id,
        userName: gift.user.name,
        createdAt: gift.createdAt,
      })),
    };

    // Salva no cache
    try {
      await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 7200);
      this.logger.debug(`Cache SET successfully for key: ${cacheKey}`);
    } catch (e) {
      this.logger.error(`Failed to SET cache for key ${cacheKey}: ${e.message}`);
    }

    return result;
  }

}
