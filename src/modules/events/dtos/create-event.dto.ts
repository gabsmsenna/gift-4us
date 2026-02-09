import {
  IsString,
  IsDate,
  IsNotEmpty,
  IsUUID,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { isValid, parse } from 'date-fns';
import { EventType } from 'src/util/event.enum';

export class CreateEventDto {
  @IsNotEmpty({ message: 'O nome do evento é obrigatório' })
  @IsString()
  title: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date());

      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }

    return value;
  })
  @IsDate({ message: 'Data do evento inválida' })
  eventDate: Date;

  // `userId` agora é obtido do token JWT (usuário autenticado)
  // e não deve mais ser enviado no corpo da requisição.

  @IsArray({ message: 'Os IDs dos grupos devem ser um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de grupo deve ser um UUID válido',
  })
  groupIds: string[];

  @IsOptional()
  @IsEnum(EventType, {
    message: 'Tipo de evento inválido. Use SECRET_FRIEND ou REGULAR',
  })
  eventType?: EventType;
}
