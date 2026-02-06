import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { UserEvent } from './entities/user-event.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Match } from '../groups/entities/match.entity';
import { EventParticipant } from './entities/event-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEvent, Group, User, GroupMember, Match, EventParticipant]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
