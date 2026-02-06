import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEvent, EventType } from './entities/user-event.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto } from './dtos/create-event.dto';
import { EventListDto } from './dtos/event-list.dto';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Match } from '../groups/entities/match.entity';
import { DrawSecretFriendDto } from './dtos/draw-secret-friend.dto';
import { EventParticipant } from './entities/event-participant.entity';
import { AddEventParticipantsDto } from './dtos/add-event-participants.dto';
import { DrawSecretFriendResponseDto } from './dtos/secret-friend-match.dto';
import { MAX_SHUFFLE_ATTEMPTS, MIN_PARTICIPANTS } from 'src/constants/events.constants';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(EventParticipant)
    private readonly eventParticipantRepository: Repository<EventParticipant>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const { title, eventDate, userId, groupIds, eventType } = createEventDto;

    const userExists = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!userExists) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const groups = await this.groupRepository
      .createQueryBuilder('group')
      .where('group.id IN (:...groupIds)', { groupIds })
      .getMany();

    if (groups.length === 0) {
      throw new BadRequestException('Nenhum grupo válido encontrado');
    }

    if (groups.length !== groupIds.length) {
      throw new BadRequestException('Um ou mais grupos não foram encontrados');
    }

    const userEvent = this.userEventRepository.create({
      title,
      eventDate,
      userId,
      user: userExists,
      groups,
      eventType: eventType || EventType.REGULAR,
    });

    const savedEvent = await this.userEventRepository.save(userEvent);

    return {
      id: savedEvent.id,
      title: savedEvent.title,
      eventDate: savedEvent.eventDate,
      userId: savedEvent.userId,
      userName: userExists.name,
      eventType: savedEvent.eventType,
      groups: savedEvent.groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
      })),
    };
  }

  async findUserEvents(userId: string): Promise<EventListDto[]> {
    const events = await this.userEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user')
      .leftJoinAndSelect('event.groups', 'groups')
      .where('event.user_id = :userId', { userId })
      .getMany();

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      eventDate: event.eventDate,
      userId: event.userId,
      userName: event.user?.name || '',
      eventType: event.eventType,
      groups:
        event.groups?.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
        })) || [],
    }));
  }

  async findGroupEvents(groupId: string): Promise<EventListDto[]> {
    const events = await this.userEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user')
      .leftJoinAndSelect('event.groups', 'groups')
      .where('groups.id = :groupId', { groupId })
      .getMany();

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      eventDate: event.eventDate,
      userId: event.userId,
      userName: event.user?.name || 'Desconhecido',
      groups:
        event.groups?.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
        })) || [],
    }));
  }


  async addEventParticipants(addEventParticipantsDto: AddEventParticipantsDto) {
    const { eventId, ownerId, participantIds } = addEventParticipantsDto;

    const event = await this.userEventRepository.findOne({
      where: { id: eventId },
      relations: ['user'],
    });

    if (!event) {
      throw new BadRequestException('Evento não encontrado');
    }

    if (event.eventType !== EventType.SECRET_FRIEND) {
      throw new BadRequestException(
        'Cadastro de participantes só é permitido para eventos do tipo SECRET_FRIEND',
      );
    }

    if (event.userId !== ownerId) {
      throw new ForbiddenException('Apenas o dono do evento pode cadastrar participantes');
    }

    if (!participantIds || participantIds.length === 0) {
      throw new BadRequestException(
        'É necessário informar pelo menos um participante para o evento',
      );
    }

    const users = await this.userRepository.find({
      where: { id: In(participantIds) },
    });

    if (users.length !== participantIds.length) {
      throw new BadRequestException(
        'Um ou mais participantes não foram encontrados',
      );
    }

    await this.eventParticipantRepository.delete({ eventId });

    participantIds.push(ownerId);

    const participantsToSave = participantIds.map((userId) =>
      this.eventParticipantRepository.create({
        eventId,
        userId,
      }),
    );

    const savedParticipants = await this.eventParticipantRepository.save(
      participantsToSave,
    );

    return {
      eventId: event.id,
      eventTitle: event.title,
      ownerId: event.userId,
      participants: savedParticipants.map((p) => ({
        id: p.id,
        userName: p.user.name,
        userId: p.userId,
      })),
    };
  }

  async drawSecretFriend(
    drawSecretFriendDto: DrawSecretFriendDto,
  ): Promise<DrawSecretFriendResponseDto> {
    const { eventId, userId } = drawSecretFriendDto;

    const event = await this.findAndValidateEvent(eventId, userId);

    const participants = await this.getValidParticipants(eventId);

    await this.validateDrawRules(participants, eventId);

    const pairs = this.generateMatches(participants);

    await this.saveMatches(event, pairs);

    return this.buildResponse(event, pairs);
  }


  private async findAndValidateEvent(eventId: string, userId: string) {
    const event = await this.userEventRepository.findOne({
      where: { id: eventId },
      relations: ['user', 'groups'],
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.eventType !== EventType.SECRET_FRIEND) {
      throw new BadRequestException(
        'Sorteio só é permitido para eventos do tipo SECRET_FRIEND',
      );
    }

    if (event.userId !== userId) {
      throw new ForbiddenException(
        'Apenas o dono do evento pode realizar o sorteio',
      );
    }

    if (!event.groups?.[0]) {
        throw new BadRequestException(
          'Evento não possui grupo associado para vincular os pares.',
        );
    }

    return event;
  }

  private async getValidParticipants(eventId: string) {
    const participants = await this.eventParticipantRepository.find({
      where: { eventId },
      relations: ['user'], 
    });

    const uniqueParticipantsMap = new Map();
    participants.forEach((p) => {
        if (p.user) uniqueParticipantsMap.set(p.userId, p.user);
    });

    return Array.from(uniqueParticipantsMap.values()); 
  }

  private async validateDrawRules(participants: any[], eventId: string) {
    const total = participants.length;

    if (total < MIN_PARTICIPANTS) {
      throw new BadRequestException(
        `O evento precisa ter no mínimo ${MIN_PARTICIPANTS} participantes para o sorteio`,
      );
    }

    if (total % 2 !== 0) {
      throw new BadRequestException(
        'O evento precisa ter uma quantidade PAR de participantes para o sorteio',
      );
    }

    const participantIds = participants.map((p) => p.id);
    const existingMatchesCount = await this.matchRepository.count({
      where: { giverId: In(participantIds) },
    });

    if (existingMatchesCount > 0) {
      throw new BadRequestException(
        'Este evento já possui sorteio realizado para um ou mais participantes',
      );
    }
  }

  private generateMatches(participants: any[]): { giver: any; receiver: any }[] {
    const givers = [...participants];
    const receivers = [...participants];
    
    let isValid = false;
    let attempts = 0;

    while (!isValid && attempts < MAX_SHUFFLE_ATTEMPTS) {
      attempts++;
      
      for (let i = receivers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
      }

      isValid = givers.every((giver, index) => giver.id !== receivers[index].id);
    }

    if (!isValid) {
      throw new BadRequestException(
        'Não foi possível gerar um sorteio válido. Tente novamente.',
      );
    }

    return givers.map((giver, index) => ({
      giver,
      receiver: receivers[index],
    }));
  }

  private async saveMatches(event: any, pairs: { giver: any; receiver: any }[]) {
    const groupId = event.groups[0].id;
    
    const matchesToSave = pairs.map((pair) => 
      this.matchRepository.create({
        groupId: groupId,
        giverId: pair.giver.id,
        receiverId: pair.receiver.id,
      })
    );

    await this.matchRepository.save(matchesToSave);
  }

  private buildResponse(event: any, pairs: { giver: User; receiver: User }[]): DrawSecretFriendResponseDto {
    return {
      eventId: event.id,
      eventTitle: event.title,
      matches: pairs.map((p) => ({
        giver: { id: p.giver.id, name: p.giver.name },
        receiver: { id: p.receiver.id, name: p.receiver.name },
      })),
    };
  }
}
