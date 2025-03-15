import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { BullModule } from '@nestjs/bull';
import { BullMQService } from './bullmq/bullmq.service';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'redis',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      }),
    }),
    ObservabilityModule,
  ],
  providers: [RabbitMQService, BullMQService],
  exports: [RabbitMQService, BullMQService, BullModule],
})
export class QueueModule {}
