import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { GiftsModule } from "./modules/gifts/gifts.module";
import { InvitesModule } from "./modules/invites/invites.module";
import { EventsModule } from "./modules/events/events.module";
import KeyvRedis from "@keyv/redis";
import { RabbitMQModule } from "./infra/rabbitmq.module";
import { RedisModule } from "./infra/redis/redis.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USER"),
        password: configService.get<string>("DB_PASS"),
        database: configService.get<string>("DB_NAME"),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisPassword = configService.get<string>("REDIS_PASS");
        const redisUrl = `redis://:${redisPassword}@localhost:6379`;

        return {
          store: new KeyvRedis(redisUrl),
          ttl: 2 * 60 * 60 * 1000,
        };
      },
    }),

    // ClientsModule.registerAsync([
    //   {
    //     name: 'RABBITMQ_SERVICE',
    //     imports: [ConfigModule],
    //     inject: [ConfigService],
    //     useFactory: (configService: ConfigService) => ({
    //       transport: Transport.RMQ,
    //       options: {
    //         urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
    //         queue: 'events_queue',
    //         queueOptions: {
    //           durable: true,
    //         },
    //       },
    //     }),
    //   },
    // ]),

    RabbitMQModule,

    RedisModule,

    UsersModule,

    AuthModule,

    GroupsModule,

    GiftsModule,

    InvitesModule,

    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
