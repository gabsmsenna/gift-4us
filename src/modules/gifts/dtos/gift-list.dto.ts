import {
  IsArray,
  IsDate,
  IsEnum,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from 'src/util/event.enum';

export class GiftInfoDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  urls: string[];

  @IsUUID()
  userId: string;

  @IsString()
  userName: string;

  @IsDate()
  createdAt: Date;
}

export class GiftListByEventDto {
  @IsUUID()
  eventId: string;

  @IsString()
  eventTitle: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsUUID()
  @IsString()
  receiverId?: string;

  @IsString()
  receiverName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GiftInfoDto)
  gifts: GiftInfoDto[];
}
