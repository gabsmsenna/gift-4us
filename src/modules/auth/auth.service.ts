import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dtos/auth-response.dto';

interface TokenPayload {
  sub: string;
  email: string;
  tokenVersion: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'password', 'birthday', 'tokenVersion', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async login(user: User): Promise<AuthResponseDto> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
      },
    };
  }

  private generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
    return this.jwtService.sign(payload, { expiresIn: expiresIn as any });
  }

  private generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    return this.jwtService.sign(payload, { expiresIn: expiresIn as any });
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken);
      
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new Error('Token has been revoked');
      }

      return this.login(user);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.increment({id: userId}, 'tokenVersion', 1);
  }
}
