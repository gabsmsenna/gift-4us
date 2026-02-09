import { IsNotEmpty, IsUUID } from 'class-validator';

export class DrawSecretFriendDto {
  @IsNotEmpty({ message: 'O ID do evento é obrigatório' })
  @IsUUID('4', { message: 'ID do evento deve ser um UUID válido' })
  eventId: string;

  // `userId` agora é obtido do token JWT (usuário autenticado)
  // e não deve mais ser enviado no corpo da requisição.
}
