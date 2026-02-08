# Design Document: JWT Authentication

## Overview

The JWT authentication system will be implemented as a new NestJS module (`auth`) that integrates with the existing users module. The design follows NestJS best practices using Passport.js for authentication strategies, JWT for token management, and guards for route protection.

The system implements a dual-token approach:
- **Access tokens** (15-minute expiration) for API authentication
- **Refresh tokens** (7-day expiration) for obtaining new access tokens

Token revocation is handled through a `tokenVersion` field in the User entity, allowing immediate invalidation of all user tokens when needed.

## Architecture

### Module Structure

```
src/modules/auth/
├── auth.module.ts           # Module definition with JWT configuration
├── auth.controller.ts       # Login and refresh endpoints
├── auth.service.ts          # Token generation and validation logic
├── strategies/
│   ├── local.strategy.ts    # Username/password validation
│   └── jwt.strategy.ts      # JWT token validation
├── guards/
│   ├── local-auth.guard.ts  # Guard for login endpoint
│   └── jwt-auth.guard.ts    # Guard for protected routes
└── dtos/
    ├── login.dto.ts         # Login request validation
    └── auth-response.dto.ts # Authentication response structure
```

### Dependencies

The auth module will depend on:
- `@nestjs/jwt` - JWT token generation and verification
- `@nestjs/passport` - Authentication strategy framework
- `passport-local` - Username/password strategy
- `passport-jwt` - JWT validation strategy
- `UsersModule` - Access to user data and validation

### Integration Points

1. **UsersModule**: Import to access UsersService and User repository
2. **Environment Configuration**: JWT secret and expiration times from ConfigService
3. **Protected Routes**: Other modules will import JwtAuthGuard to protect endpoints

## Components and Interfaces

### AuthService

Core service responsible for authentication logic:

```typescript
class AuthService {
  // Validate user credentials (used by LocalStrategy)
  async validateUser(email: string, password: string): Promise<User | null>
  
  // Generate access and refresh tokens
  async login(user: User): Promise<AuthResponse>
  
  // Validate refresh token and generate new tokens
  async refresh(refreshToken: string): Promise<AuthResponse>
  
  // Generate JWT token with payload
  private generateAccessToken(payload: TokenPayload): string
  
  // Generate refresh token with payload
  private generateRefreshToken(payload: TokenPayload): string
  
  // Verify and decode JWT token
  private verifyToken(token: string): TokenPayload
}
```

### LocalStrategy

Passport strategy for validating email/password credentials:

```typescript
class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(authService: AuthService)
  
  // Validate credentials and return user
  async validate(email: string, password: string): Promise<User>
}
```

### JwtStrategy

Passport strategy for validating JWT tokens:

```typescript
class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService, userRepository: Repository<User>)
  
  // Validate token payload and return user
  async validate(payload: TokenPayload): Promise<User>
}
```

### AuthController

HTTP endpoints for authentication:

```typescript
class AuthController {
  // POST /auth/login - Authenticate user and return tokens
  @UseGuards(LocalAuthGuard)
  async login(@Request() req): Promise<AuthResponse>
  
  // POST /auth/refresh - Refresh access token using refresh token
  async refresh(@Body() body: { refreshToken: string }): Promise<AuthResponse>
}
```

### Guards

- **LocalAuthGuard**: Extends `AuthGuard('local')` for login endpoint
- **JwtAuthGuard**: Extends `AuthGuard('jwt')` for protected routes

## Data Models

### TokenPayload

Structure embedded in JWT tokens:

```typescript
interface TokenPayload {
  sub: string;        // User ID
  email: string;      // User email
  tokenVersion: number; // Token version for revocation
  iat?: number;       // Issued at (added by JWT)
  exp?: number;       // Expiration (added by JWT)
}
```

### AuthResponse

Response structure for login and refresh endpoints:

```typescript
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
```

### LoginDto

Request validation for login endpoint:

```typescript
class LoginDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(6)
  password: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties and redundancies:

**Testable Properties:**
- 1.1: Valid credentials generate tokens (property)
- 1.2: Invalid email returns error (property)
- 1.3: Invalid password returns error (property)
- 1.4: Token payload contains required fields (property)
- 1.5: Access token expiration time (example)
- 1.6: Refresh token expiration time (example)
- 2.1: Valid refresh token generates new access token (property)
- 2.2: Valid refresh token generates new refresh token (property)
- 2.4: Outdated token version rejected (property)
- 3.1: Valid token allows request (property)
- 3.3: Invalid token rejected (property)
- 3.5: Token extraction provides user info (property)
- 4.3: Successful validation excludes password (property)
- 7.3: Auth responses exclude sensitive fields (property)

**Redundancies Identified:**
- 2.5 is redundant with 2.4 (same validation, different wording)
- 4.4 is redundant with 1.3 (both test wrong password rejection)
- 5.1, 5.2, 5.3 are all redundant with 2.4 (all test token version validation)
- 6.3 is redundant with 1.5 (same access token expiration)
- 6.4 is redundant with 1.6 (same refresh token expiration)
- 6.5 is redundant with 1.4 (same payload structure)

**Properties to Combine:**
- 2.1 and 2.2 can be combined into a single property: "Refresh token generates new token pair"
- 4.3 and 7.3 can be combined into a single property: "Authentication responses never expose passwords"
- 1.2 and 1.3 can be combined into a single property: "Invalid credentials return authentication error"

**Edge Cases (handled by generators/library):**
- 2.3: Expired refresh token
- 3.2: Expired access token
- 3.4: Missing access token

After reflection, the final property list will focus on unique, non-redundant validations.

### Correctness Properties

Property 1: Valid credentials generate complete token pair
*For any* valid user with correct email and password, authentication should return both an access token and a refresh token that are valid JWT strings
**Validates: Requirements 1.1**

Property 2: Invalid credentials are rejected
*For any* authentication attempt with either an invalid email or incorrect password, the system should return an authentication error and not generate tokens
**Validates: Requirements 1.2, 1.3**

Property 3: Token payload contains required user information
*For any* generated token (access or refresh), decoding the JWT should reveal a payload containing the user's ID, email, and current token version
**Validates: Requirements 1.4**

Property 4: Refresh token generates new token pair
*For any* valid refresh token, using it to refresh should return both a new access token and a new refresh token
**Validates: Requirements 2.1, 2.2**

Property 5: Outdated token version invalidates tokens
*For any* user with existing tokens, incrementing the user's token version should cause all previously issued tokens to be rejected during validation
**Validates: Requirements 2.4, 5.1**

Property 6: Valid access token authorizes requests
*For any* protected endpoint and valid access token, including the token in the Authorization header should allow the request to proceed and provide user context
**Validates: Requirements 3.1, 3.5**

Property 7: Invalid tokens are rejected by guards
*For any* protected endpoint and malformed or invalid access token, the request should be rejected with an unauthorized error
**Validates: Requirements 3.3**

Property 8: Authentication responses never expose passwords
*For any* authentication response (login or refresh), the returned user object should never contain the password field or any other sensitive credential information
**Validates: Requirements 4.3, 7.3**

## Error Handling

### Error Scenarios

1. **Invalid Credentials**
   - Status: 401 Unauthorized
   - Message: "Invalid credentials"
   - Trigger: Wrong email or password during login

2. **Expired Token**
   - Status: 401 Unauthorized
   - Message: "Token expired"
   - Trigger: Using expired access or refresh token

3. **Invalid Token**
   - Status: 401 Unauthorized
   - Message: "Invalid token"
   - Trigger: Malformed JWT or invalid signature

4. **Outdated Token Version**
   - Status: 401 Unauthorized
   - Message: "Token has been revoked"
   - Trigger: Token version mismatch

5. **Missing Token**
   - Status: 401 Unauthorized
   - Message: "No token provided"
   - Trigger: Protected route accessed without Authorization header

6. **User Not Found**
   - Status: 401 Unauthorized
   - Message: "User not found"
   - Trigger: Token references non-existent user

### Error Handling Strategy

- All authentication errors return 401 Unauthorized status
- Error messages are generic to avoid leaking information about valid emails
- Passport strategies throw UnauthorizedException for validation failures
- Guards catch and transform Passport errors into consistent responses
- JWT library errors (expired, malformed) are caught and transformed

## Testing Strategy

### Dual Testing Approach

The authentication system will be validated using both unit tests and property-based tests:

**Unit Tests** will cover:
- Specific examples of successful login flow
- Edge cases like expired tokens, missing tokens, malformed tokens
- Integration between AuthService and UsersService
- Guard behavior on protected routes
- Error message formatting and status codes

**Property-Based Tests** will cover:
- Universal properties across all valid user credentials
- Token generation and validation for any user
- Token version invalidation across random version increments
- Password exclusion from all authentication responses
- Token payload structure for all generated tokens

### Property-Based Testing Configuration

- **Library**: fast-check (TypeScript property-based testing library)
- **Minimum iterations**: 100 runs per property test
- **Test tagging**: Each property test must include a comment with format:
  ```typescript
  // Feature: jwt-authentication, Property N: [property description]
  ```

### Test Organization

```
src/modules/auth/
├── auth.service.spec.ts          # Unit tests for AuthService
├── auth.service.properties.spec.ts # Property tests for AuthService
├── strategies/
│   ├── local.strategy.spec.ts    # Unit tests for LocalStrategy
│   └── jwt.strategy.spec.ts      # Unit tests for JwtStrategy
└── guards/
    └── jwt-auth.guard.spec.ts    # Unit tests for JwtAuthGuard
```

### Key Test Scenarios

**Unit Tests:**
- Login with valid credentials returns tokens
- Login with invalid email returns 401
- Login with wrong password returns 401
- Refresh with valid token returns new tokens
- Refresh with expired token returns 401
- Refresh with outdated version returns 401
- Protected route with valid token succeeds
- Protected route without token returns 401
- Protected route with invalid token returns 401

**Property Tests:**
- Property 1: Valid credentials generate complete token pair
- Property 2: Invalid credentials are rejected
- Property 3: Token payload contains required user information
- Property 4: Refresh token generates new token pair
- Property 5: Outdated token version invalidates tokens
- Property 6: Valid access token authorizes requests
- Property 7: Invalid tokens are rejected by guards
- Property 8: Authentication responses never expose passwords

Each property test will:
1. Generate random test data (users, passwords, token versions)
2. Execute the authentication flow
3. Verify the property holds across all generated inputs
4. Run minimum 100 iterations to ensure comprehensive coverage
