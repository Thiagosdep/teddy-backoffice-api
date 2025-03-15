import { Module } from '@nestjs/common';
import { QueueModule } from '../infrastructure/queue/queue.module';
import { BullModule } from '@nestjs/bull';
import { UserNotificationProcessor } from './processors/user-notification.processor';
import { ObservabilityModule } from '../infrastructure/observability/observability.module';
import { UserModule } from '../user/user.module';
import { UserNotificationController } from './user-notification.controller';
import { UserNotificationService } from './user-notification.service';

@Module({
  imports: [
    QueueModule,
    UserModule,
    ObservabilityModule,
    BullModule.registerQueue({
      name: 'user-notifications',
    }),
  ],
  controllers: [UserNotificationController],
  providers: [UserNotificationService, UserNotificationProcessor],
})
export class UserNotificationModule {}
