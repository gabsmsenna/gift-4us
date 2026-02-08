# Implementation Plan: JWT Authentication

## Overview

This implementation plan breaks down the JWT authentication feature into discrete coding tasks. The approach follows NestJS best practices, integrating Passport.js strategies, JWT token management, and guards for route protection. Each task builds incrementally, ensuring the system is testable at every stage.

## Tasks

- [x] 1. Install required dependencies and configure JWT module
  - Install `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-local`, `passport-jwt`, and their TypeScript types
  - Install `fast-check` for property-based testing
  - Configure JwtModule in auth module with secret and expiration times from environment variables
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Create auth module structure and DTOs
  - Create `src/modules/auth/` directory with module, controller, and service files
  - Create `dtos/login.dto.ts` with email and password validation
  - Create `dtos/auth-response.dto.ts` for token response structure
  - Create `strategies/` and `guards/` subdirectories
  - _Requirements: 1.1, 7.1_

- [x] 3. Implement AuthService with token generation
  - [x] 3.1 Create AuthService with UsersService and JwtService injection
    - Inject UsersService and JwtService via constructor
    - Import User repository for token version validation
    - _Requirements: 7.1, 7.2_
  
  - [x] 3.2 Implement validateUser method for credential validation
    - Query user by email with password field included
    - Use bcrypt.compare to validate password
    - Return user without password on success, null on failure
    - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 7.4_
  
  - [x] 3.3 Implement token generation methods
    - Create generateAccessToken method with 15-minute expiration
    - Create generateRefreshToken method with 7-day expiration
    - Include user ID, email, and tokenVersion in payload
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 6.3, 6.4, 6.5_
  
  - [x] 3.4 Implement login method
    - Accept User object and generate both tokens
    - Return AuthResponse with tokens and sanitized user data
    - Exclude password and other sensitive fields from response
    - _Requirements: 1.1, 7.3_
  
  - [x] 3.5 Write property test for token generation

    - **Property 1: Valid credentials generate complete token pair**
    - **Validates: Requirements 1.1**
  
  - [ ]* 3.6 Write property test for token payload structure
    - **Property 3: Token payload contains required user information**
    - **Validates: Requirements 1.4**
  
  - [ ]* 3.7 Write property test for password exclusion
    - **Property 8: Authentication responses never expose passwords**
    - **Validates: Requirements 4.3, 7.3**
  
  - [ ]* 3.8 Write unit tests for AuthService
    - Test validateUser with correct and incorrect credentials
    - Test login method returns proper token structure
    - Test token expiration times are correctly set
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

- [x] 4. Implement LocalStrategy for username/password authentication
  - [x] 4.1 Create LocalStrategy extending PassportStrategy
    - Configure strategy to use 'email' field instead of 'username'
    - Inject AuthService for credential validation
    - _Requirements: 1.2, 1.3_
  
  - [x] 4.2 Implement validate method
    - Call authService.validateUser with email and password
    - Throw UnauthorizedException if validation fails
    - Return user object on success
    - _Requirements: 1.2, 1.3, 4.3_
  
  - [ ]* 4.3 Write property test for invalid credentials
    - **Property 2: Invalid credentials are rejected**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ]* 4.4 Write unit tests for LocalStrategy
    - Test successful validation returns user
    - Test failed validation throws UnauthorizedException
    - Test email field is used instead of username
    - _Requirements: 1.2, 1.3_

- [x] 5. Implement JwtStrategy for token validation
  - [x] 5.1 Create JwtStrategy extending PassportStrategy
    - Configure strategy to extract JWT from Authorization header
    - Use same secret as token generation
    - Inject User repository for token version validation
    - _Requirements: 3.1, 5.2_
  
  - [x] 5.2 Implement validate method with token version check
    - Extract payload from validated JWT
    - Query user by ID from payload
    - Compare payload tokenVersion with user's current tokenVersion
    - Throw UnauthorizedException if versions don't match or user not found
    - Return user object on success
    - _Requirements: 2.4, 5.1, 5.2, 5.3, 3.5_
  
  - [ ]* 5.3 Write property test for token version invalidation
    - **Property 5: Outdated token version invalidates tokens**
    - **Validates: Requirements 2.4, 5.1**
  
  - [ ]* 5.4 Write property test for valid token authorization
    - **Property 6: Valid access token authorizes requests**
    - **Validates: Requirements 3.1, 3.5**
  
  - [ ]* 5.5 Write unit tests for JwtStrategy
    - Test valid token with matching version succeeds
    - Test token with outdated version is rejected
    - Test token for non-existent user is rejected
    - _Requirements: 2.4, 3.1, 5.1_

- [x] 6. Create authentication guards
  - [x] 6.1 Create LocalAuthGuard extending AuthGuard('local')
    - Simple guard wrapper for local strategy
    - _Requirements: 1.1_
  
  - [x] 6.2 Create JwtAuthGuard extending AuthGuard('jwt')
    - Simple guard wrapper for JWT strategy
    - Make it exportable for use in other modules
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 6.3 Write property test for invalid token rejection
    - **Property 7: Invalid tokens are rejected by guards**
    - **Validates: Requirements 3.3**
  
  - [ ]* 6.4 Write unit tests for guards
    - Test JwtAuthGuard rejects requests without token
    - Test JwtAuthGuard rejects requests with invalid token
    - Test JwtAuthGuard allows requests with valid token
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Implement AuthController with login and refresh endpoints
  - [x] 7.1 Create login endpoint
    - POST /auth/login with LoginDto validation
    - Apply LocalAuthGuard to trigger credential validation
    - Extract user from request object (populated by Passport)
    - Call authService.login to generate tokens
    - Return AuthResponse with tokens and user data
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 7.2 Implement refresh endpoint
    - POST /auth/refresh accepting refreshToken in body
    - Verify refresh token using JwtService
    - Extract user ID and token version from payload
    - Query user and validate token version matches
    - Generate new token pair if valid
    - Throw UnauthorizedException if token is invalid or expired
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 7.3 Write property test for refresh token flow
    - **Property 4: Refresh token generates new token pair**
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ]* 7.4 Write unit tests for AuthController
    - Test login endpoint returns tokens for valid credentials
    - Test login endpoint returns 401 for invalid credentials
    - Test refresh endpoint returns new tokens for valid refresh token
    - Test refresh endpoint returns 401 for expired token
    - Test refresh endpoint returns 401 for outdated token version
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [x] 8. Configure and wire auth module
  - [x] 8.1 Configure AuthModule imports and providers
    - Import UsersModule to access UsersService and User repository
    - Import PassportModule
    - Import and configure JwtModule with async configuration
    - Register LocalStrategy and JwtStrategy as providers
    - Register AuthService and AuthController
    - Export JwtAuthGuard for use in other modules
    - _Requirements: 7.1, 7.2_
  
  - [x] 8.2 Add environment variables for JWT configuration
    - Add JWT_SECRET to .env file
    - Add JWT_ACCESS_EXPIRATION (default: 15m)
    - Add JWT_REFRESH_EXPIRATION (default: 7d)
    - Update ConfigService types if needed
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [x] 8.3 Import AuthModule in AppModule
    - Add AuthModule to imports array in app.module.ts
    - _Requirements: 7.1_

- [x] 9. Checkpoint - Verify authentication system works end-to-end
  - Ensure all tests pass (unit and property tests)
  - Manually test login endpoint with valid and invalid credentials
  - Manually test refresh endpoint with valid and expired tokens
  - Manually test protected route with JwtAuthGuard
  - Ask the user if questions arise

- [x] 10. Add example protected endpoint for testing
  - [x] 10.1 Create test endpoint in UsersController
    - Add GET /users/me endpoint
    - Apply @UseGuards(JwtAuthGuard) decorator
    - Extract user from request using @Request() decorator
    - Return current user information
    - _Requirements: 3.1, 3.5_
  
  - [ ]* 10.2 Write integration test for protected endpoint
    - Test endpoint returns 401 without token
    - Test endpoint returns 401 with invalid token
    - Test endpoint returns user data with valid token
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Run full test suite (unit, property, and integration tests)
  - Verify test coverage meets requirements
  - Ensure all authentication flows work correctly
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across random inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows NestJS conventions and integrates with existing user module
- JWT configuration uses environment variables for flexibility across environments
- Token version mechanism enables immediate revocation of all user tokens when needed
