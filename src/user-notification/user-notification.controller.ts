import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserNotificationService } from './user-notification.service';
import { NotificationPayload } from './types/user-notification.type';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';

@ApiTags('users notifications')
@Controller({ path: 'users/notifications', version: '1' })
export class UserNotificationController {
  constructor(
    private readonly notificationService: UserNotificationService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send a notification to a user' })
  @ApiResponse({ status: 201, description: 'Notification has been queued.' })
  async sendNotification(
    @Body() payload: NotificationPayload,
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(
        `Received request to send notification to user ${payload.userId}`,
        'UserNotificationController',
      );

      await this.notificationService.sendNotification(payload);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error sending notification: ${error.message}`,
        error.stack,
        'UserNotificationController',
      );
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notifications processing statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns notifications processing stats.',
  })
  async getStats(): Promise<any> {
    try {
      this.logger.log(
        'Received request to get notifications processing stats',
        'UserNotificationController',
      );

      return await this.notificationService.getNotificationStats();
    } catch (error) {
      this.logger.error(
        `Error getting notifications processing stats: ${error.message}`,
        error.stack,
        'UserNotificationController',
      );
      throw error;
    }
  }
}
