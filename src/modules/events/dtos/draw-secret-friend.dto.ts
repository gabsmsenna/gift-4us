import { IsNotEmpty, IsUUID } from 'class-validator';

export class DrawSecretFriendDto {
  @IsNotEmpty({ message: 'O ID do evento é obrigatório' })
  @IsUUID('4', { message: 'ID do evento deve ser um UUID válido' })
  eventId: string;

  @IsNotEmpty({ message: 'O ID do usuário é obrigatório' })
  @IsUUID('4', { message: 'ID do usuário deve ser um UUID válido' })
  userId: string;
}

