import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AddEventParticipantsDto {
  @IsNotEmpty({ message: 'O ID do evento é obrigatório' })
  @IsUUID('4', { message: 'ID do evento deve ser um UUID válido' })
  eventId: string;

  @IsNotEmpty({ message: 'O ID do usuário dono é obrigatório' })
  @IsUUID('4', { message: 'ID do usuário deve ser um UUID válido' })
  ownerId: string;

  @IsArray({ message: 'Os IDs dos participantes devem ser um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de participante deve ser um UUID válido',
  })
  participantIds: string[];
}
