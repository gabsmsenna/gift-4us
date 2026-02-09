import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider: Provider = {
    provide: REDIS_CLIENT,
    useFactory: (configService: ConfigService) => {
        const redisPassword = configService.get<string>('REDIS_PASS');
        return new Redis({
            host: 'localhost',
            port: 6379,
            password: redisPassword,
        });
    },
    inject: [ConfigService],
};

@Global()
@Module({
    providers: [redisProvider],
    exports: [redisProvider],
})
export class RedisModule { }
