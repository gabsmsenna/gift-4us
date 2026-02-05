import {
  IsString,
  IsDate,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../entities/user-event.entity';

export class GroupInfoDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;
}

export class EventListDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsDate()
  eventDate: Date;

  @IsUUID()
  userId: string;

  @IsString()
  userName: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupInfoDto)
  groups: GroupInfoDto[];
}
