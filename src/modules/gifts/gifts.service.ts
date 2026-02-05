import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gift } from './entities/gift.entity';
import { User } from '../users/entities/user.entity';
import { UserEvent } from '../events/entities/user-event.entity';
import { CreateGiftDto } from './dtos/create-gift.dto';

@Injectable()
export class GiftsService {
  constructor(
    @InjectRepository(Gift)
    private readonly giftRepository: Repository<Gift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
  ) {}

  async create(createGiftDto: CreateGiftDto) {
    const { title, urls, userId, eventIds } = createGiftDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const events = await this.userEventRepository
      .createQueryBuilder('event')
      .where('event.id IN (:...eventIds)', { eventIds })
      .andWhere('event.user_id = :userId', { userId })
      .getMany();

    if (events.length === 0) {
      throw new BadRequestException('Nenhum evento válido encontrado');
    }

    if (events.length !== eventIds.length) {
      throw new BadRequestException('Um ou mais eventos não foram encontrados');
    }

    const gift = this.giftRepository.create({
      title,
      urls,
      user,
      events,
    });

    const savedGift = await this.giftRepository.save(gift);

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
      })),
      createdAt: savedGift.createdAt,
    };
  }
}
