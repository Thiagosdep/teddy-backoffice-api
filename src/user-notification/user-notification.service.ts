import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../infrastructure/queue/rabbitmq/rabbitmq.service';
import { BullMQService } from '../infrastructure/queue/bullmq/bullmq.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';
import { UserService } from '../user/user.service';
import { NotificationPayload } from './types/user-notification.type';

@Injectable()
export class UserNotificationService {
  private readonly EXCHANGE_NAME = 'user.notifications';
  private readonly QUEUE_NAME = 'user-notifications';

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly bullMQService: BullMQService,
    @InjectQueue('user-notifications') private notificationQueue: Queue,
    private readonly logger: WinstonLoggerService,
    private readonly userService: UserService,
  ) {
    this.initializeRabbitMQ();
    this.initializeBullMQ();
  }

  private async initializeRabbitMQ() {
    try {
      await this.rabbitMQService.assertExchange(this.EXCHANGE_NAME, 'topic', {
        durable: true,
      });

      await this.rabbitMQService.assertQueue('email-notifications', {
        durable: true,
      });

      await this.rabbitMQService.bindQueue(
        'email-notifications',
        this.EXCHANGE_NAME,
        'notification.email',
      );
      await this.setupConsumers();

      this.logger.log(
        'RabbitMQ setup completed for user notifications',
        'UserNotificationService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize RabbitMQ for notifications: ${error.message}`,
        error.stack,
        'UserNotificationService',
      );
    }
  }

  private async initializeBullMQ() {
    try {
      await this.bullMQService.registerQueue(
        this.QUEUE_NAME,
        this.notificationQueue,
      );
      this.logger.log(
        'BullMQ setup completed for user notifications',
        'UserNotificationService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize BullMQ for notifications: ${error.message}`,
        error.stack,
        'UserNotificationService',
      );
    }
  }

  private async setupConsumers() {
    await this.rabbitMQService.consume('email-notifications', (msg) => {
      const content = JSON.parse(msg.content.toString());
      this.logger.log(
        `Processing email notification: ${JSON.stringify(content)}`,
        'UserNotificationService',
      );
    });
  }

  private getRoutingKey(payload: NotificationPayload): string {
    return `notification.${payload.type}`;
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      await this.userService.get(payload.userId);

      const routingKey = this.getRoutingKey(payload);

      await this.rabbitMQService.publishToExchange(
        this.EXCHANGE_NAME,
        routingKey,
        payload,
      );

      const options = {
        priority: this.getPriorityLevel(payload.priority),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      };

      await this.bullMQService.addJob(
        this.QUEUE_NAME,
        'process-notification',
        payload,
        options,
      );

      this.logger.log(
        `Notification queued for user ${payload.userId} of type ${payload.type}`,
        'UserNotificationService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
        'UserNotificationService',
      );
      throw error;
    }
  }

  private getPriorityLevel(priority: string): number {
    switch (priority) {
      case 'high':
        return 1;
      case 'medium':
        return 2;
      case 'low':
        return 3;
      default:
        return 2;
    }
  }

  async getNotificationStats(): Promise<any> {
    try {
      const bullStats = await this.bullMQService.getJobCounts(this.QUEUE_NAME);

      return {
        pendingJobs: bullStats.waiting || 0,
        activeJobs: bullStats.active || 0,
        completedJobs: bullStats.completed || 0,
        failedJobs: bullStats.failed || 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification stats: ${error.message}`,
        error.stack,
        'UserNotificationService',
      );
      throw error;
    }
  }
}
