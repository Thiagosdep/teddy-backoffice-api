import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { WinstonLoggerService } from '../../observability/logger/winston-logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: any;

  constructor(
    private configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${err}`, err, 'RedisService');
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected', 'RedisService');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
      this.logger.log('Redis client disconnected', 'RedisService');
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
