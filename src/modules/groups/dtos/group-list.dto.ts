import {
  IsString,
  IsDate,
  IsEnum,
  IsUUID,
  IsArray,
  IsOptional,
} from 'class-validator';
import { GroupStatus } from '../entities/group.entity';
import { EventType } from '../../events/entities/user-event.entity';

export class GroupMemberDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsDate()
  joinedAt: Date;
}

export class UserEventDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsDate()
  eventDate: Date;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsEnum(EventType)
  eventType: EventType;
}

export class GroupListDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(GroupStatus)
  status: GroupStatus;

  @IsUUID()
  ownerId: string;

  @IsString()
  ownerName: string;

  @IsArray()
  members: GroupMemberDto[];

  @IsOptional()
  @IsArray()
  userEvents?: UserEventDto[];
}
