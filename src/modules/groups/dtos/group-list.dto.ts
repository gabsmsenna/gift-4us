import { IsString, IsDate, IsEnum, IsUUID, IsArray } from 'class-validator';
import { GroupStatus } from '../entities/group.entity';

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

export class GroupListDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(GroupStatus)
  status: GroupStatus;

  @IsDate()
  eventDate: Date;

  @IsUUID()
  ownerId: string;

  @IsString()
  ownerName: string;

  @IsArray()
  members: GroupMemberDto[];
}
