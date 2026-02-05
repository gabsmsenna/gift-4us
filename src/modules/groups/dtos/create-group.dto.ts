import {
  IsString,
  IsDate,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { GroupStatus } from '../entities/group.entity';

export class CreateGroupDto {
  @IsNotEmpty({ message: 'O nome do grupo é obrigatório' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GroupStatus, {
    message: 'Status inválido. Use PENDING, ACTIVE ou COMPLETED',
  })
  status?: GroupStatus;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return value as Date;
  })
  @IsDate({ message: 'Data do evento inválida' })
  eventDate: Date;

  @IsNotEmpty({ message: 'O ID do dono do grupo é obrigatório' })
  @IsUUID('4', { message: 'ID do dono deve ser um UUID válido' })
  ownerId: string;
}
