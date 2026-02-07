import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { UserEvent } from './entities/user-event.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Match } from '../groups/entities/match.entity';
import { EventParticipant } from './entities/event-participant.entity';
import { EventSupply } from './entities/event-supply.entity';
import { SupplyContribution } from './entities/supply-contribution.entity';
import { EventSuppliesService } from './services/event-supplies.service';
import { EventSuppliesController } from './controllers/event-supplies.controller';
import { SupplyContributionsController } from './controllers/supply-contributions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEvent,
      Group,
      User,
      GroupMember,
      Match,
      EventParticipant,
      EventSupply,
      SupplyContribution,
    ]),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'events_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [
    EventsController,
    EventSuppliesController,
    SupplyContributionsController,
  ],
  providers: [EventsService, EventSuppliesService],
  exports: [EventSuppliesService],
})
export class EventsModule {}
