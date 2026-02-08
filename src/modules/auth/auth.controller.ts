import { Controller, Post, UseGuards, Request, Body, UnauthorizedException, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }): Promise<AuthResponseDto> {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      return await this.authService.refresh(body.refreshToken);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req) {
    const userId = req.user.sub || req.user.id;

    await this.authService.logout(userId);

  }
}
