export class SecretFriendParticipantDto {
  id: string;
  name: string;
}

export class SecretFriendPairDto {
  giver: SecretFriendParticipantDto;
  receiver: SecretFriendParticipantDto;
}

export class DrawSecretFriendResponseDto {
  eventId: string;
  eventTitle: string;
  matches: SecretFriendPairDto[];
}
