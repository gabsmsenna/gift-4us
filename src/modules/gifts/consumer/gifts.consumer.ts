
import { Controller, Inject, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventPattern, Payload, Ctx, RmqContext } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS_CLIENT } from 'src/infra/redis/redis.module';

@Controller()
export class GiftsConsumer {
  private readonly logger = new Logger(GiftsConsumer.name);
  private readonly CACHE_PREFIX = "gifts:event";

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis
  ) { }

  @EventPattern("cache.invalidate.gifts")
  async handleCacheInvalidation(
    @Payload() data: { eventIds: string[] },
    @Ctx() context: RmqContext,
  ) {
    const { eventIds } = data;

    this.logger.log(
      `Recebido comando de invalidação para ${eventIds.length} eventos.`,
    );

    try {
      for (const eventId of eventIds) {
        await this.invalidateEventCache(eventId);
      }
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache: ${error.message}`);
    }
  }

  private async invalidateEventCache(eventId: string) {
    // Pattern adjusted to match any namespace prefix (e.g., 'keyv:') or none
    // But since we are using raw redis in Service without prefixing 'keyv:', we should match 'gifts:event:...' directly?
    // GiftsService uses `CACHE_PREFIX = "gifts:event"`.
    // It calls `this.redisClient.set(cacheKey, ...)`
    // So the key in Redis is EXACTLY "gifts:event:..."
    // So the pattern `*gifts:event:${eventId}:*` is still safe and correct.
    const pattern = `*${this.CACHE_PREFIX}:${eventId}:*`;

    try {
      const keys = await this.redisClient.keys(pattern);

      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.log(
          `[ASYNC] Cache limpo para evento ${eventId}: ${keys.length} chaves removidas.`,
        );
      } else {
        this.logger.debug(`Nenhuma chave encontrada para o padrão: ${pattern}`);
        // Debug: List keys that DO exist to diagnose
        const allKeys = await this.redisClient.keys('*');
        this.logger.debug(`DEBUG: All keys in Redis: ${JSON.stringify(allKeys)}`);
      }
    } catch (err) {
      this.logger.error(`Falha na invalidação do Redis: ${err.message}`);
    }
  }
}
