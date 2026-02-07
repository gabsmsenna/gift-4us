# Product Overview

Gift 4U is a gift suggestion and event management platform that helps users organize gift exchanges and special events within groups.

## Core Features

- **User Management**: Registration, authentication, and profile management with birthday tracking
- **Group Management**: Create and manage groups for gift exchanges (Secret Santa, weddings, birthdays)
- **Gift Lists**: Users maintain wishlists with product links, price ranges, and images
- **Event Organization**: Users create events and associate them with multiple groups
- **Secret Santa/Matching**: Automated drawing system that pairs gift givers with receivers
- **Invite System**: Secure, time-limited email invitations with single-use tokens

## Key Workflows

1. **Group Creation**: Owner creates group → invites members via email → members accept using secure tokens
2. **Gift Registration**: Users add gifts to their wishlist → associate gifts with specific groups
3. **Event Setup**: User creates event → selects participating groups → event appears in group timeline
4. **Secret Santa Draw**: Admin triggers draw → system generates matches → sends personalized notifications asynchronously

## Architecture Strategy

The system uses a **cache-aside pattern** with Redis for high-performance gift list reads and **asynchronous processing** via RabbitMQ for email notifications and cache invalidation to ensure responsiveness.
