import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GiftsService } from "./gifts.service";
import { GiftsController } from "./gifts.controller";
import { GiftsConsumer } from "./consumer/gifts.consumer";
import { Gift } from "./entities/gift.entity";
import { User } from "../users/entities/user.entity";
import { UserEvent } from "../events/entities/user-event.entity";
import { EventParticipant } from "../events/entities/event-participant.entity";
import { Match } from "../groups/entities/match.entity";
import { RedisModule } from 'src/infra/redis/redis.module';

@Module({
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([Gift, User, UserEvent, EventParticipant, Match]),
  ],
  controllers: [GiftsController, GiftsConsumer],
  providers: [GiftsService],
})
export class GiftsModule { }
