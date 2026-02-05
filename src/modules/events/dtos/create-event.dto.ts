import { IsString, IsDate, IsNotEmpty, IsUUID, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { isValid, parse } from 'date-fns';

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

  @IsNotEmpty({ message: 'O ID do usuário é obrigatório' })
  @IsUUID('4', { message: 'ID do usuário deve ser um UUID válido' })
  userId: string;

  @IsArray({ message: 'Os IDs dos grupos devem ser um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de grupo deve ser um UUID válido',
  })
  groupIds: string[];
}
