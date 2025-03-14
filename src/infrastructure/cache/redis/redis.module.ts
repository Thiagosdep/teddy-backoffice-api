import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { ObservabilityModule } from '../../../infrastructure/observability/observability.module';

@Module({
  imports: [ConfigModule, ObservabilityModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
