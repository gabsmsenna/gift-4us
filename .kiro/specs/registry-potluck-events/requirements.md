# Requirements Document

## Introduction

This document specifies the requirements for expanding the Gift 4U event system to support two new event types: Registry (for weddings and baby showers) and Potluck (for BBQs and collaborative events). Currently, the system only supports SECRET_FRIEND events where users maintain personal wishlists. The new event types invert this logic: the Event defines what items are needed, and Users commit to contribute specific items or quantities.

## Glossary

- **Event_System**: The Gift 4U event management subsystem
- **Event_Owner**: The user who created an event
- **Group_Admin**: A user with administrative privileges in a group
- **Event_Participant**: A user who is a member of a group associated with an event
- **Event_Supply**: An item or resource needed for a Registry or Potluck event
- **Supply_Contribution**: A commitment by a user to provide a specific quantity of an Event_Supply
- **Quantity_Needed**: The total amount of an Event_Supply required for an event
- **Quantity_Committed**: The total amount of an Event_Supply that users have committed to provide
- **Over_Contribution**: A situation where Quantity_Committed exceeds Quantity_Needed

## Requirements

### Requirement 1: Event Type Support

**User Story:** As an event organizer, I want to create Registry and Potluck events in addition to Secret Friend events, so that I can manage different types of gift exchanges and collaborative gatherings.

#### Acceptance Criteria

1. THE Event_System SHALL support three event types: SECRET_FRIEND, REGISTRY, and POTLUCK
2. WHEN an event is created with type REGISTRY, THE Event_System SHALL enable the event supplies workflow
3. WHEN an event is created with type POTLUCK, THE Event_System SHALL enable the event supplies workflow
4. WHEN an event is created with type SECRET_FRIEND, THE Event_System SHALL continue using the existing gifts and matches workflow

### Requirement 2: Event Supply Management

**User Story:** As an event owner, I want to create a list of supplies needed for my Registry or Potluck event, so that participants know what items are required.

#### Acceptance Criteria

1. WHEN an Event_Owner creates an Event_Supply, THE Event_System SHALL store the item name, description, quantity needed, unit, image URL, and product URL
2. WHEN an Event_Owner requests to create an Event_Supply for a REGISTRY or POTLUCK event, THE Event_System SHALL accept the request
3. WHEN a non-owner, non-admin user requests to create an Event_Supply, THE Event_System SHALL reject the request with an authorization error
4. WHEN an Event_Owner requests to update an Event_Supply, THE Event_System SHALL apply the changes
5. WHEN an Event_Owner requests to delete an Event_Supply, THE Event_System SHALL remove it and all associated Supply_Contributions

### Requirement 3: Supply Contribution Management

**User Story:** As an event participant, I want to commit to bringing specific items or quantities for a Registry or Potluck event, so that the organizer knows what will be provided.

#### Acceptance Criteria

1. WHEN an Event_Participant creates a Supply_Contribution, THE Event_System SHALL store the supply ID, user ID, quantity committed, and optional notes
2. WHEN an Event_Participant requests to create a Supply_Contribution, THE Event_System SHALL validate that the user is a participant in the event
3. WHEN an Event_Participant requests to update their Supply_Contribution, THE Event_System SHALL apply the changes
4. WHEN an Event_Participant requests to delete their Supply_Contribution, THE Event_System SHALL remove it
5. WHEN a non-participant user requests to create a Supply_Contribution, THE Event_System SHALL reject the request with an authorization error

### Requirement 4: Contribution Validation

**User Story:** As an event organizer, I want the system to prevent over-commitment of supplies, so that participants don't bring excessive quantities of items.

#### Acceptance Criteria

1. WHEN a Supply_Contribution is created or updated, THE Event_System SHALL calculate the total Quantity_Committed for that Event_Supply
2. WHEN the total Quantity_Committed would exceed Quantity_Needed by more than 20%, THE Event_System SHALL reject the contribution with a validation error
3. WHEN the total Quantity_Committed would exceed Quantity_Needed by 20% or less, THE Event_System SHALL accept the contribution and return a warning message
4. WHEN calculating Quantity_Committed, THE Event_System SHALL sum all existing contributions plus the new or updated contribution quantity

### Requirement 5: Supply Progress Tracking

**User Story:** As an event participant, I want to see how much of each supply has been committed, so that I can decide what to contribute.

#### Acceptance Criteria

1. WHEN retrieving Event_Supplies for an event, THE Event_System SHALL include the Quantity_Needed for each supply
2. WHEN retrieving Event_Supplies for an event, THE Event_System SHALL include the total Quantity_Committed for each supply
3. WHEN retrieving Event_Supplies for an event, THE Event_System SHALL calculate the fulfillment percentage as (Quantity_Committed / Quantity_Needed) * 100
4. WHEN retrieving Supply_Contributions for a specific Event_Supply, THE Event_System SHALL return all contributions with user information, quantity committed, and notes

### Requirement 6: Data Persistence

**User Story:** As a system administrator, I want event supplies and contributions stored in a relational database, so that data integrity is maintained.

#### Acceptance Criteria

1. THE Event_System SHALL store Event_Supplies in an event_supplies table with columns: id (UUID), event_id (UUID FK), item_name (text), description (text), quantity_needed (integer), unit (text), image_url (text), url (text), created_at (timestamp), updated_at (timestamp)
2. THE Event_System SHALL store Supply_Contributions in a supply_contributions table with columns: id (UUID), supply_id (UUID FK), user_id (UUID FK), quantity_committed (integer), notes (text), created_at (timestamp), updated_at (timestamp)
3. WHEN an event is deleted, THE Event_System SHALL cascade delete all associated Event_Supplies and Supply_Contributions
4. WHEN an Event_Supply is deleted, THE Event_System SHALL cascade delete all associated Supply_Contributions
5. THE Event_System SHALL use snake_case naming for all database tables and columns

### Requirement 7: API Endpoints

**User Story:** As a frontend developer, I want RESTful API endpoints for managing event supplies and contributions, so that I can build the user interface.

#### Acceptance Criteria

1. THE Event_System SHALL provide a POST /events/:eventId/supplies endpoint that creates an Event_Supply and requires Event_Owner or Group_Admin authorization
2. THE Event_System SHALL provide a GET /events/:eventId/supplies endpoint that returns all Event_Supplies with aggregated contribution data
3. THE Event_System SHALL provide a PATCH /events/:eventId/supplies/:supplyId endpoint that updates an Event_Supply and requires Event_Owner or Group_Admin authorization
4. THE Event_System SHALL provide a DELETE /events/:eventId/supplies/:supplyId endpoint that deletes an Event_Supply and requires Event_Owner or Group_Admin authorization
5. THE Event_System SHALL provide a POST /supplies/:supplyId/contributions endpoint that creates a Supply_Contribution and requires Event_Participant authorization
6. THE Event_System SHALL provide a GET /supplies/:supplyId/contributions endpoint that returns all Supply_Contributions for a specific Event_Supply
7. THE Event_System SHALL provide a PATCH /contributions/:contributionId endpoint that updates a Supply_Contribution and requires ownership by the requesting user
8. THE Event_System SHALL provide a DELETE /contributions/:contributionId endpoint that deletes a Supply_Contribution and requires ownership by the requesting user

### Requirement 8: Input Validation

**User Story:** As a system administrator, I want all API inputs validated, so that invalid data is rejected before processing.

#### Acceptance Criteria

1. WHEN creating an Event_Supply, THE Event_System SHALL validate that item_name is a non-empty string
2. WHEN creating an Event_Supply, THE Event_System SHALL validate that quantity_needed is a positive integer
3. WHEN creating an Event_Supply, THE Event_System SHALL validate that unit is a non-empty string
4. WHEN creating a Supply_Contribution, THE Event_System SHALL validate that quantity_committed is a positive integer
5. WHEN creating or updating an Event_Supply or Supply_Contribution, THE Event_System SHALL validate that all UUID references exist in the database

### Requirement 9: Caching Strategy

**User Story:** As a system administrator, I want frequently accessed supply lists cached, so that the system performs efficiently under load.

#### Acceptance Criteria

1. WHEN Event_Supplies are retrieved for an event, THE Event_System SHALL cache the results in Redis with a TTL of 2 hours
2. WHEN an Event_Supply is created, updated, or deleted, THE Event_System SHALL invalidate the cache for that event's supplies
3. WHEN a Supply_Contribution is created, updated, or deleted, THE Event_System SHALL invalidate the cache for the associated event's supplies
4. THE Event_System SHALL use cache keys in the format "event:supplies:{eventId}"
