import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateGroupDto } from './dtos/create-group.dto';
import { GroupListDto } from './dtos/group-list.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createGroupDto: CreateGroupDto) {
    const { ownerId, ...groupData } = createGroupDto;

    const ownerExists = await this.userRepository.findOne({
      where: { id: ownerId },
    });

    if (!ownerExists) {
      throw new Error('Usuário dono não encontrado');
    }

    const group = this.groupRepository.create({
      ...groupData,
      ownerId,
      owner: ownerExists,
    });

    const savedGroup = await this.groupRepository.save(group);

    const member = this.groupMemberRepository.create({
      groupId: savedGroup.id,
      group: savedGroup,
      userId: ownerId,
      user: ownerExists,
    });

    await this.groupMemberRepository.save(member);

    return {
      id: savedGroup.id,
      name: savedGroup.name,
      description: savedGroup.description,
      status: savedGroup.status,
      ownerId: savedGroup.ownerId,
      ownerName: ownerExists.name,
      createdAt: savedGroup.createdAt,
    };
  }

  async findUserGroups(userId: string): Promise<GroupListDto[]> {
    const groups = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.owner', 'owner')
      .leftJoinAndSelect('group.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('group.events', 'events')
      .leftJoinAndSelect('events.user', 'eventUser')
      .where('members.user_id = :userId', { userId })
      .getMany();

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      status: group.status,
      ownerId: group.ownerId,
      ownerName: group.owner?.name || '',
      members: group.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        joinedAt: member.joinedAt,
      })),
      userEvents:
        group.events?.map((event) => ({
          id: event.id,
          title: event.title,
          eventDate: event.eventDate,
          userId: event.userId,
          userName: event.user?.name || '',
          eventType: event.eventType,
        })) || [],
    }));
  }

  async getMembersGroup(groupId: string) {
    const group = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .where('group.id = :groupId', { groupId })
      .getOne();

    if (!group) {
      return null;
    }

    return group.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      joinedAt: member.joinedAt,
    }));
  }
}
