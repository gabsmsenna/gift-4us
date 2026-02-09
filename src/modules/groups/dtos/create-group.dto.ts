import {
  IsString,
  IsDate,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
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

}
