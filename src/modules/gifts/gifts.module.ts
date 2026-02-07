import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { Gift } from './entities/gift.entity';
import { User } from '../users/entities/user.entity';
import { UserEvent } from '../events/entities/user-event.entity';
import { EventParticipant } from '../events/entities/event-participant.entity';
import { Match } from '../groups/entities/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gift, User, UserEvent, EventParticipant, Match]),
  ],
  controllers: [GiftsController],
  providers: [GiftsService],
})
export class GiftsModule {}
