# Requirements Document

## Introduction

This document specifies the requirements for implementing JWT-based authentication in the Gift 4U platform. The authentication system will provide secure user login, token-based session management, and protected route access using JSON Web Tokens (JWT) with refresh token capabilities.

## Glossary

- **Auth_System**: The authentication module responsible for validating credentials and managing JWT tokens
- **Access_Token**: A short-lived JWT token used to authenticate API requests
- **Refresh_Token**: A long-lived JWT token used to obtain new access tokens without re-authentication
- **JWT_Strategy**: The Passport strategy that validates JWT tokens from request headers
- **Local_Strategy**: The Passport strategy that validates username/password credentials
- **Auth_Guard**: NestJS guard that protects routes requiring authentication
- **Token_Payload**: The data structure embedded within JWT tokens containing user identification
- **Token_Version**: A counter in the User entity used to invalidate all tokens when incremented

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to log in with my email and password, so that I can access protected features of the platform.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (email and password), THE Auth_System SHALL generate an Access_Token and Refresh_Token
2. WHEN a user submits an invalid email, THE Auth_System SHALL return an authentication error
3. WHEN a user submits an invalid password, THE Auth_System SHALL return an authentication error
4. WHEN generating tokens, THE Auth_System SHALL include the user ID and token version in the Token_Payload
5. THE Access_Token SHALL expire after 15 minutes
6. THE Refresh_Token SHALL expire after 7 days

### Requirement 2: Token Refresh

**User Story:** As a user, I want to refresh my access token without logging in again, so that I can maintain my session seamlessly.

#### Acceptance Criteria

1. WHEN a user provides a valid Refresh_Token, THE Auth_System SHALL generate a new Access_Token
2. WHEN a user provides a valid Refresh_Token, THE Auth_System SHALL generate a new Refresh_Token
3. WHEN a user provides an expired Refresh_Token, THE Auth_System SHALL return an authentication error
4. WHEN a user provides a Refresh_Token with an outdated token version, THE Auth_System SHALL return an authentication error
5. WHEN generating new tokens, THE Auth_System SHALL validate that the token version matches the user's current token version

### Requirement 3: Protected Route Access

**User Story:** As a developer, I want to protect specific routes with authentication, so that only authenticated users can access sensitive endpoints.

#### Acceptance Criteria

1. WHEN a request includes a valid Access_Token in the Authorization header, THE Auth_Guard SHALL allow the request to proceed
2. WHEN a request includes an expired Access_Token, THE Auth_Guard SHALL reject the request with an unauthorized error
3. WHEN a request includes an invalid Access_Token, THE Auth_Guard SHALL reject the request with an unauthorized error
4. WHEN a request does not include an Access_Token, THE Auth_Guard SHALL reject the request with an unauthorized error
5. WHEN a valid Access_Token is provided, THE Auth_System SHALL extract the user information and make it available to the route handler

### Requirement 4: Password Validation

**User Story:** As a system, I want to securely validate user passwords, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN validating credentials, THE Local_Strategy SHALL retrieve the user's hashed password from the database
2. WHEN comparing passwords, THE Auth_System SHALL use bcrypt to compare the provided password with the stored hash
3. WHEN passwords match, THE Local_Strategy SHALL return the user object without the password field
4. WHEN passwords do not match, THE Local_Strategy SHALL return null

### Requirement 5: Token Revocation

**User Story:** As a user, I want the ability to invalidate all my active sessions, so that I can secure my account if needed.

#### Acceptance Criteria

1. WHEN a user's token version is incremented, THE Auth_System SHALL reject all tokens issued before the increment
2. WHEN validating a token, THE Auth_System SHALL compare the token's version with the user's current token version
3. WHEN token versions do not match, THE Auth_System SHALL reject the token with an authentication error

### Requirement 6: JWT Configuration

**User Story:** As a system administrator, I want JWT tokens to be configured securely, so that the authentication system is robust against attacks.

#### Acceptance Criteria

1. THE Auth_System SHALL use a secret key from environment variables for signing tokens
2. THE Auth_System SHALL use HS256 algorithm for token signing
3. THE Access_Token SHALL include an expiration time of 15 minutes
4. THE Refresh_Token SHALL include an expiration time of 7 days
5. THE Token_Payload SHALL include user ID, email, and token version

### Requirement 7: Integration with Existing User Module

**User Story:** As a developer, I want the authentication module to integrate seamlessly with the existing user module, so that user management remains centralized.

#### Acceptance Criteria

1. THE Auth_System SHALL use the existing UsersService to retrieve user data
2. THE Auth_System SHALL use the existing User entity for authentication
3. WHEN creating authentication responses, THE Auth_System SHALL exclude sensitive fields like password
4. THE Auth_System SHALL leverage the existing bcrypt password hashing from the user creation flow
