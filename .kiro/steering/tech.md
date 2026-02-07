# Technology Stack

## Core Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: NestJS 11.x (progressive Node.js framework)
- **Package Manager**: pnpm
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis (via ioredis and @keyv/redis)
- **Message Queue**: RabbitMQ (via amqplib and amqp-connection-manager)
- **Validation**: class-validator and class-transformer
- **Authentication**: bcrypt for password hashing
- **Testing**: Jest with ts-jest

## Key Libraries

- `@nestjs/typeorm` - Database integration
- `@nestjs/cache-manager` - Caching layer
- `@nestjs/microservices` - RabbitMQ integration
- `@nestjs/config` - Environment configuration
- `date-fns` - Date manipulation
- `class-validator` - DTO validation
- `class-transformer` - Object transformation

## Common Commands

### Development
```bash
pnpm install              # Install dependencies
pnpm run start:dev        # Start in watch mode
pnpm run start:debug      # Start with debugger
```

### Building
```bash
pnpm run build            # Compile TypeScript to dist/
pnpm run start:prod       # Run production build
```

### Testing
```bash
pnpm run test             # Run unit tests
pnpm run test:watch       # Run tests in watch mode
pnpm run test:e2e         # Run end-to-end tests
pnpm run test:cov         # Generate coverage report
```

### Code Quality
```bash
pnpm run lint             # Run ESLint with auto-fix
pnpm run format           # Format code with Prettier
```

## TypeScript Configuration

- **Module System**: NodeNext (ESM-compatible)
- **Target**: ES2023
- **Decorators**: Enabled (required for NestJS)
- **Strict Mode**: Partial (strictNullChecks enabled, noImplicitAny disabled)
- **Output**: dist/ directory

## Infrastructure

- **Docker Compose**: Used for local development (PostgreSQL, Redis, RabbitMQ)
- **Database Sync**: TypeORM synchronize enabled (development only)
- **Cache TTL**: 2 hours default
- **Queue**: Durable queue named 'events_queue'
