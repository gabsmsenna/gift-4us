import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEvent } from './entities/user-event.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto } from './dtos/create-event.dto';
import { EventListDto } from './dtos/event-list.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const { title, eventDate, userId, groupIds } = createEventDto;

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
    });

    const savedEvent = await this.userEventRepository.save(userEvent);

    return {
      id: savedEvent.id,
      title: savedEvent.title,
      eventDate: savedEvent.eventDate,
      userId: savedEvent.userId,
      userName: userExists.name,
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
    eventDate: event.eventDate,
    userId: event.userId, // Ou event.user.id se não tiver a coluna mapeada direto
    userName: event.user?.name || 'Desconhecido', // Tratamento de nulo
    groups:
      event.groups?.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
      })) || [],
  }));
}
}
