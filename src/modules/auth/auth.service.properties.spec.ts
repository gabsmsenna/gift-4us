import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthService - Property-Based Tests', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload, options) => {
              // Simple mock that returns a JWT-like string
              return `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
            }),
            verify: jest.fn((token) => {
              // Simple mock that decodes the payload
              const parts = token.split('.');
              return JSON.parse(Buffer.from(parts[1], 'base64').toString());
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_ACCESS_EXPIRATION: '15m',
                JWT_REFRESH_EXPIRATION: '7d',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  // Feature: jwt-authentication, Property 1: Valid credentials generate complete token pair
  describe('Property 1: Valid credentials generate complete token pair', () => {
    it('should generate both access and refresh tokens for any valid user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 6, maxLength: 20 }),
            birthday: fc.date(),
            tokenVersion: fc.nat({ max: 100 }),
          }),
          async (userData) => {
            // Arrange: Create a user with hashed password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user: User = {
              ...userData,
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
              gifts: [],
              memberships: [],
            };

            // Mock repository to return user with password for validation
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

            // Act: Validate user and login
            const validatedUser = await authService.validateUser(userData.email, userData.password);
            expect(validatedUser).not.toBeNull();

            const result = await authService.login(validatedUser!);

            // Assert: Both tokens should be present and valid JWT strings
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(typeof result.accessToken).toBe('string');
            expect(typeof result.refreshToken).toBe('string');
            expect(result.accessToken.split('.')).toHaveLength(3); // JWT format: header.payload.signature
            expect(result.refreshToken.split('.')).toHaveLength(3);

            // Verify tokens contain correct payload
            const accessPayload = jwtService.verify(result.accessToken);
            const refreshPayload = jwtService.verify(result.refreshToken);

            expect(accessPayload.sub).toBe(userData.id);
            expect(accessPayload.email).toBe(userData.email);
            expect(accessPayload.tokenVersion).toBe(userData.tokenVersion);

            expect(refreshPayload.sub).toBe(userData.id);
            expect(refreshPayload.email).toBe(userData.email);
            expect(refreshPayload.tokenVersion).toBe(userData.tokenVersion);

            // Verify user data in response excludes password
            expect(result.user).toBeDefined();
            expect(result.user.id).toBe(userData.id);
            expect(result.user.email).toBe(userData.email);
            expect(result.user.name).toBe(userData.name);
            expect(result.user).not.toHaveProperty('password');
          },
        ),
        { numRuns: 100 },
      );
    }, 30000); // 30 second timeout for property-based test
  });
});
