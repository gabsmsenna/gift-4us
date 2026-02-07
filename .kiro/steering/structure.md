# Project Structure

## Directory Layout

```
src/
├── modules/           # Feature modules (domain-driven organization)
│   ├── users/        # User management
│   ├── groups/       # Group management
│   ├── gifts/        # Gift wishlist management
│   ├── events/       # Event organization
│   └── invites/      # Invitation system
├── constants/        # Application constants
├── app.module.ts     # Root application module
└── main.ts           # Application entry point

test/                 # E2E tests
dist/                 # Compiled output
```

## Module Structure Pattern

Each feature module follows a consistent structure:

```
modules/{feature}/
├── {feature}.module.ts      # Module definition
├── {feature}.controller.ts  # HTTP endpoints
├── {feature}.service.ts     # Business logic
├── entities/                # TypeORM entities
│   └── {entity}.entity.ts
└── dtos/                    # Data Transfer Objects
    └── {action}-{entity}.dto.ts
```

## Naming Conventions

- **Files**: kebab-case (e.g., `user-event.entity.ts`)
- **Classes**: PascalCase (e.g., `UserEvent`)
- **Database Tables**: snake_case (e.g., `user_events`)
- **Database Columns**: snake_case with explicit mapping (e.g., `@Column({ name: 'created_at' })`)
- **DTOs**: Descriptive action prefix (e.g., `CreateUserDto`, `AddEventParticipantsDto`)

## Entity Conventions

- Use `@Entity()` decorator with table name matching database
- Primary keys: UUID with `@PrimaryGeneratedColumn('uuid')`
- Timestamps: `@CreateDateColumn()` and `@UpdateDateColumn()`
- Relations: Use TypeORM decorators (`@OneToMany`, `@ManyToOne`, etc.)
- Sensitive fields: Mark with `{ select: false }` (e.g., passwords)

## Module Organization

- **Controllers**: Handle HTTP requests, validation, and responses
- **Services**: Contain business logic and database operations
- **Entities**: Define database schema and relationships
- **DTOs**: Define request/response shapes with validation decorators
- **Module**: Import dependencies, declare providers, export services

## Dependency Injection

- Services are injected via constructor
- Repository pattern: `@InjectRepository(Entity)` for database access
- Module exports: Export services that other modules need to import

## Configuration

- Environment variables managed via `@nestjs/config`
- Global configuration in `app.module.ts`
- Database, cache, and RabbitMQ configured asynchronously using `ConfigService`

## Key Architectural Patterns

- **Repository Pattern**: TypeORM repositories for data access
- **DTO Pattern**: Separate DTOs for input validation and output serialization
- **Module Pattern**: Feature-based modules with clear boundaries
- **Dependency Injection**: Constructor-based injection throughout
- **Cache-Aside**: Redis caching with manual invalidation via RabbitMQ
