import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { WinstonLoggerService } from '../../infrastructure/observability/logger/winston-logger.service';
import { NotificationPayload } from '../types/user-notification.type';

@Processor('user-notifications')
export class UserNotificationProcessor {
  constructor(private readonly logger: WinstonLoggerService) {}

  @Process('process-notification')
  async processNotification(job: Job<NotificationPayload>): Promise<void> {
    try {
      const { data } = job;
      this.logger.log(
        `Processing notification job ${job.id} for user ${data.userId} of type ${data.type}`,
        'UserNotificationProcessor',
      );

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));

      switch (data.type) {
        case 'email':
          await this.sendEmail(data);
          break;
      }

      this.logger.log(
        `Successfully processed notification job ${job.id}`,
        'UserNotificationProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Error processing notification job ${job.id}: ${error.message}`,
        error.stack,
        'UserNotificationProcessor',
      );
      throw error;
    }
  }

  private async sendEmail(data: NotificationPayload): Promise<void> {
    this.logger.log(
      `[MOCK] Sending email to user ${data.userId}: ${data.message}`,
      'UserNotificationProcessor',
    );
  }
}
