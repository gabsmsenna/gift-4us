import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { UserEvent } from './entities/user-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEvent])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
