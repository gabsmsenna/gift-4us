# Implementation Plan: Registry and Potluck Events

## Overview

This implementation extends the Gift 4U event system to support REGISTRY and POTLUCK event types. The approach follows NestJS module patterns, creating new entities for event supplies and contributions, implementing service layer business logic with authorization and validation, exposing RESTful API endpoints, and integrating Redis caching with RabbitMQ-based invalidation.

## Tasks

- [x] 1. Extend database schema and create TypeORM entities
  - [x] 1.1 Add REGISTRY and POTLUCK values to event_type enum in database
    - Create migration to alter the event_type enum
    - Update UserEvent entity to reflect new enum values
    - _Requirements: 1.1_
  
  - [x] 1.2 Create EventSupply entity with all required fields
    - Create `src/modules/events/entities/event-supply.entity.ts`
    - Define entity with UUID primary key, foreign key to user_events, and all supply fields
    - Add @ManyToOne relationship to UserEvent
    - Add @OneToMany relationship to SupplyContribution
    - Use snake_case column names with explicit @Column mappings
    - _Requirements: 2.1, 6.1, 6.5_
  
  - [x] 1.3 Create SupplyContribution entity with all required fields
    - Create `src/modules/events/entities/supply-contribution.entity.ts`
    - Define entity with UUID primary key, foreign keys to event_supplies and users
    - Add @ManyToOne relationships to EventSupply and User
    - Use snake_case column names with explicit @Column mappings
    - _Requirements: 3.1, 6.2, 6.5_
  
  - [x] 1.4 Update UserEvent entity to include supplies relationship
    - Add @OneToMany relationship from UserEvent to EventSupply
    - Ensure cascade delete is configured
    - _Requirements: 6.3_

- [x] 2. Create DTOs for request validation and response serialization
  - [x] 2.1 Create CreateEventSupplyDto with validation decorators
    - Create `src/modules/events/dtos/create-event-supply.dto.ts`
    - Add validation: @IsString(), @IsNotEmpty() for itemName and unit
    - Add validation: @IsInt(), @Min(1) for quantityNeeded
    - Add optional fields: description, imageUrl, url with @IsOptional(), @IsUrl()
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 2.2 Create UpdateEventSupplyDto with partial validation
    - Create `src/modules/events/dtos/update-event-supply.dto.ts`
    - Make all fields optional using @IsOptional()
    - Reuse validation decorators from CreateEventSupplyDto
    - _Requirements: 2.4_
  
  - [x] 2.3 Create CreateSupplyContributionDto with validation decorators
    - Create `src/modules/events/dtos/create-supply-contribution.dto.ts`
    - Add validation: @IsInt(), @Min(1) for quantityCommitted
    - Add optional notes field with @IsString(), @IsOptional()
    - _Requirements: 8.4_
  
  - [x] 2.4 Create UpdateSupplyContributionDto with partial validation
    - Create `src/modules/events/dtos/update-supply-contribution.dto.ts`
    - Make all fields optional using @IsOptional()
    - Reuse validation decorators from CreateSupplyContributionDto
    - _Requirements: 3.3_
  
  - [x] 2.5 Create EventSupplyWithProgressDto for response serialization
    - Create `src/modules/events/dtos/event-supply-with-progress.dto.ts`
    - Include all EventSupply fields plus quantityCommitted and fulfillmentPercentage
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Implement EventSuppliesService with core business logic
  - [x] 3.1 Create EventSuppliesService class with repository injection
    - Create `src/modules/events/services/event-supplies.service.ts`
    - Inject EventSupply, SupplyContribution, UserEvent, and User repositories
    - Inject CacheManager and RabbitMQ client
    - _Requirements: 2.1, 3.1_
  
  - [x] 3.2 Implement createSupply method with authorization
    - Verify user is event owner or group admin using verifyEventOwnerOrAdmin helper
    - Validate event type is REGISTRY or POTLUCK
    - Create and save EventSupply entity
    - Invalidate cache for event supplies
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.3 Implement getEventSupplies method with progress calculation
    - Check cache first using getCacheKey helper
    - If cache miss, query database with contributions relation
    - Calculate quantityCommitted by summing contribution quantities
    - Calculate fulfillmentPercentage as (quantityCommitted / quantityNeeded) * 100
    - Cache results with 2-hour TTL
    - Return EventSupplyWithProgressDto array
    - _Requirements: 5.1, 5.2, 5.3, 9.1_
  
  - [x] 3.4 Implement updateSupply method with authorization
    - Verify user is event owner or group admin
    - Apply updates to EventSupply entity
    - Save changes
    - Invalidate cache for event supplies
    - _Requirements: 2.4_
  
  - [x] 3.5 Implement deleteSupply method with authorization and cascade
    - Verify user is event owner or group admin
    - Delete EventSupply (cascade will remove contributions)
    - Invalidate cache for event supplies
    - _Requirements: 2.5_
  
  - [x] 3.6 Implement createContribution method with validation
    - Verify user is event participant using verifyEventParticipant helper
    - Validate contribution quantity using validateContributionQuantity helper
    - If over 20% threshold, throw validation error
    - If within 20% threshold, create contribution and return warning
    - Create and save SupplyContribution entity
    - Invalidate cache for event supplies
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3_
  
  - [x] 3.7 Implement getSupplyContributions method
    - Query SupplyContribution repository with user relation
    - Return all contributions with user information
    - _Requirements: 5.4_
  
  - [x] 3.8 Implement updateContribution method with validation
    - Verify user owns the contribution using verifyContributionOwner helper
    - Validate new quantity using validateContributionQuantity helper (exclude current contribution)
    - Apply updates to SupplyContribution entity
    - Save changes
    - Invalidate cache for event supplies
    - _Requirements: 3.3, 4.1, 4.2, 4.3_
  
  - [x] 3.9 Implement deleteContribution method with authorization
    - Verify user owns the contribution
    - Delete SupplyContribution entity
    - Invalidate cache for event supplies
    - _Requirements: 3.4_

- [x] 4. Implement authorization and validation helper methods
  - [x] 4.1 Implement verifyEventOwnerOrAdmin helper method
    - Query UserEvent to get owner and associated groups
    - Query group memberships to check if user is admin
    - Throw ForbiddenException if user is neither owner nor admin
    - _Requirements: 2.2, 2.3_
  
  - [x] 4.2 Implement verifyEventParticipant helper method
    - Query UserEvent to get associated groups
    - Query group memberships to check if user is member of any group
    - Throw ForbiddenException if user is not a participant
    - _Requirements: 3.2, 3.5_
  
  - [x] 4.3 Implement verifyContributionOwner helper method
    - Query SupplyContribution to get userId
    - Throw ForbiddenException if userId doesn't match requesting user
    - _Requirements: 3.3, 3.4_
  
  - [x] 4.4 Implement validateContributionQuantity helper method
    - Query all contributions for the supply
    - Calculate total committed using calculateTotalCommitted helper
    - Calculate maximum allowed as quantityNeeded * 1.2
    - Return validation result with isValid flag and warning message
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.5 Implement calculateTotalCommitted helper method
    - Sum all contribution quantities
    - Optionally exclude a specific contribution ID (for updates)
    - Return total as integer
    - _Requirements: 4.1, 4.4_

- [x] 5. Implement cache management methods
  - [x] 5.1 Implement getCacheKey helper method
    - Return cache key in format "event:supplies:{eventId}"
    - _Requirements: 9.4_
  
  - [x] 5.2 Implement invalidateSuppliesCache method
    - Delete cache key using CacheManager
    - Publish cache invalidation message to RabbitMQ events_queue
    - Handle errors gracefully (log but don't fail request)
    - _Requirements: 9.2, 9.3_

- [x] 6. Create EventSuppliesController with RESTful endpoints
  - [x] 6.1 Create EventSuppliesController class
    - Create `src/modules/events/controllers/event-supplies.controller.ts`
    - Inject EventSuppliesService
    - Add @Controller('events') decorator
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 6.2 Implement POST /events/:eventId/supplies endpoint
    - Add @Post(':eventId/supplies') decorator
    - Extract userId from request (authentication middleware)
    - Validate body using CreateEventSupplyDto
    - Call service.createSupply
    - Return 201 Created with created supply
    - _Requirements: 7.1_
  
  - [x] 6.3 Implement GET /events/:eventId/supplies endpoint
    - Add @Get(':eventId/supplies') decorator
    - Call service.getEventSupplies
    - Return 200 OK with supplies array including progress data
    - _Requirements: 7.2_
  
  - [x] 6.4 Implement PATCH /events/:eventId/supplies/:supplyId endpoint
    - Add @Patch(':eventId/supplies/:supplyId') decorator
    - Extract userId from request
    - Validate body using UpdateEventSupplyDto
    - Call service.updateSupply
    - Return 200 OK with updated supply
    - _Requirements: 7.3_
  
  - [x] 6.5 Implement DELETE /events/:eventId/supplies/:supplyId endpoint
    - Add @Delete(':eventId/supplies/:supplyId') decorator
    - Extract userId from request
    - Call service.deleteSupply
    - Return 204 No Content
    - _Requirements: 7.4_

- [x] 7. Create SupplyContributionsController with RESTful endpoints
  - [x] 7.1 Create SupplyContributionsController class
    - Create `src/modules/events/controllers/supply-contributions.controller.ts`
    - Inject EventSuppliesService
    - Add @Controller('supplies') decorator
    - _Requirements: 7.5, 7.6, 7.7, 7.8_
  
  - [x] 7.2 Implement POST /supplies/:supplyId/contributions endpoint
    - Add @Post(':supplyId/contributions') decorator
    - Extract userId from request
    - Validate body using CreateSupplyContributionDto
    - Call service.createContribution
    - Handle warning response if over-contribution within threshold
    - Return 201 Created with created contribution
    - _Requirements: 7.5_
  
  - [x] 7.3 Implement GET /supplies/:supplyId/contributions endpoint
    - Add @Get(':supplyId/contributions') decorator
    - Call service.getSupplyContributions
    - Return 200 OK with contributions array
    - _Requirements: 7.6_
  
  - [x] 7.4 Implement PATCH /contributions/:contributionId endpoint
    - Add @Patch(':contributionId') decorator (note: different path pattern)
    - Extract userId from request
    - Validate body using UpdateSupplyContributionDto
    - Call service.updateContribution
    - Handle warning response if over-contribution within threshold
    - Return 200 OK with updated contribution
    - _Requirements: 7.7_
  
  - [x] 7.5 Implement DELETE /contributions/:contributionId endpoint
    - Add @Delete(':contributionId') decorator
    - Extract userId from request
    - Call service.deleteContribution
    - Return 204 No Content
    - _Requirements: 7.8_

- [x] 8. Update EventsModule to register new components
  - [x] 8.1 Register new entities in TypeORM
    - Add EventSupply and SupplyContribution to TypeOrmModule.forFeature()
    - _Requirements: 6.1, 6.2_
  
  - [x] 8.2 Register services and controllers
    - Add EventSuppliesService to providers array
    - Add EventSuppliesController and SupplyContributionsController to controllers array
    - Export EventSuppliesService if needed by other modules
    - _Requirements: 2.1, 3.1, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [-] 9. Implement error handling and exception filters
  - [x] 9.1 Add try-catch blocks in service methods
    - Catch TypeORM errors and throw appropriate NestJS exceptions
    - Catch validation errors and throw BadRequestException
    - Catch authorization errors and throw ForbiddenException
    - Catch not found errors and throw NotFoundException
    - _Requirements: 2.3, 3.5, 4.2, 8.5_
  
  - [x] 9.2 Implement graceful degradation for cache failures
    - Wrap cache operations in try-catch
    - Log cache errors but continue operation
    - Fetch from database if cache fails
    - _Requirements: 9.1_
  
  - [ ] 9.3 Implement graceful handling for RabbitMQ failures
    - Wrap message publishing in try-catch
    - Log RabbitMQ errors but don't fail request
    - Implement retry logic with exponential backoff
    - _Requirements: 9.2, 9.3_

- [ ]* 10. Write property-based tests for correctness properties
  - [ ]* 10.1 Install fast-check library for property-based testing
    - Run: pnpm add -D fast-check
    - Create arbitraries for EventSupply and SupplyContribution
    - _Requirements: All_
  
  - [ ]* 10.2 Write property test for Event Supply Data Persistence
    - **Property 1: Event Supply Data Persistence**
    - **Validates: Requirements 2.1**
  
  - [ ]* 10.3 Write property test for Supply Contribution Data Persistence
    - **Property 2: Supply Contribution Data Persistence**
    - **Validates: Requirements 3.1**
  
  - [ ]* 10.4 Write property test for Authorization for Supply Creation
    - **Property 3: Authorization for Supply Creation**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ]* 10.5 Write property test for Authorization for Contribution Creation
    - **Property 4: Authorization for Contribution Creation**
    - **Validates: Requirements 3.2, 3.5**
  
  - [ ]* 10.6 Write property test for Supply Update Persistence
    - **Property 5: Supply Update Persistence**
    - **Validates: Requirements 2.4**
  
  - [ ]* 10.7 Write property test for Contribution Update Persistence
    - **Property 6: Contribution Update Persistence**
    - **Validates: Requirements 3.3**
  
  - [ ]* 10.8 Write property test for Supply Deletion Cascades to Contributions
    - **Property 7: Supply Deletion Cascades to Contributions**
    - **Validates: Requirements 2.5**
  
  - [ ]* 10.9 Write property test for Contribution Deletion
    - **Property 8: Contribution Deletion**
    - **Validates: Requirements 3.4**
  
  - [ ]* 10.10 Write property test for Total Quantity Committed Calculation
    - **Property 9: Total Quantity Committed Calculation**
    - **Validates: Requirements 4.1, 4.4**
  
  - [ ]* 10.11 Write property test for Over-Contribution Rejection
    - **Property 10: Over-Contribution Rejection**
    - **Validates: Requirements 4.2**
  
  - [ ]* 10.12 Write property test for Over-Contribution Warning
    - **Property 11: Over-Contribution Warning**
    - **Validates: Requirements 4.3**
  
  - [ ]* 10.13 Write property test for Supply Progress Data Completeness
    - **Property 12: Supply Progress Data Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ]* 10.14 Write property test for Contribution List Completeness
    - **Property 13: Contribution List Completeness**
    - **Validates: Requirements 5.4**
  
  - [ ]* 10.15 Write property test for Event Deletion Cascades
    - **Property 14: Event Deletion Cascades to Supplies and Contributions**
    - **Validates: Requirements 6.3**
  
  - [ ]* 10.16 Write property test for Input Validation for Invalid Data
    - **Property 15: Input Validation for Invalid Data**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  
  - [ ]* 10.17 Write property test for Referential Integrity Validation
    - **Property 16: Referential Integrity Validation**
    - **Validates: Requirements 8.5**
  
  - [ ]* 10.18 Write property test for Supply List Caching
    - **Property 17: Supply List Caching**
    - **Validates: Requirements 9.1**
  
  - [ ]* 10.19 Write property test for Cache Invalidation on Mutations
    - **Property 18: Cache Invalidation on Mutations**
    - **Validates: Requirements 9.2, 9.3**

- [ ]* 11. Write unit tests for specific examples and edge cases
  - [ ]* 11.1 Write unit test for creating registry event with wedding supplies
    - Test specific example: wedding registry with gifts
    - _Requirements: 1.2, 2.1_
  
  - [ ]* 11.2 Write unit test for creating potluck event with food items
    - Test specific example: BBQ potluck with food and drinks
    - _Requirements: 1.3, 2.1_
  
  - [ ]* 11.3 Write unit test for contribution at exactly 20% over-commitment threshold
    - Test edge case: contribution that puts total at exactly 120% of needed
    - Should succeed with warning
    - _Requirements: 4.3_
  
  - [ ]* 11.4 Write unit test for contribution exceeding 20% over-commitment threshold
    - Test edge case: contribution that puts total at 121% of needed
    - Should fail with validation error
    - _Requirements: 4.2_
  
  - [ ]* 11.5 Write unit test for deleting supply with zero contributions
    - Test edge case: deleting supply that has no contributions
    - _Requirements: 2.5_
  
  - [ ]* 11.6 Write unit test for non-existent event ID
    - Test error condition: creating supply for non-existent event
    - Should throw NotFoundException
    - _Requirements: 8.5_
  
  - [ ]* 11.7 Write unit test for non-existent supply ID
    - Test error condition: creating contribution for non-existent supply
    - Should throw NotFoundException
    - _Requirements: 8.5_
  
  - [ ]* 11.8 Write unit test for malformed UUID formats
    - Test error condition: invalid UUID format in request
    - Should throw BadRequestException
    - _Requirements: 8.5_

- [ ]* 12. Write integration tests for end-to-end workflows
  - [ ]* 12.1 Write E2E test for complete registry workflow
    - Create event → add supplies → multiple users contribute → verify progress
    - _Requirements: 1.2, 2.1, 3.1, 5.1, 5.2, 5.3_
  
  - [ ]* 12.2 Write E2E test for complete potluck workflow
    - Create event → add supplies → users contribute → update contributions → verify totals
    - _Requirements: 1.3, 2.1, 3.1, 3.3, 4.1_
  
  - [ ]* 12.3 Write E2E test for cache invalidation flow
    - Get supplies (cache) → add contribution → get supplies (cache invalidated) → verify fresh data
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties (18 total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All code follows NestJS conventions and existing project structure
