export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    name: string;
  };
}
