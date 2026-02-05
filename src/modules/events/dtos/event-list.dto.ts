import {
  IsString,
  IsDate,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupInfoDto)
  groups: GroupInfoDto[];
}
