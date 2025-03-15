import { ApiProperty } from '@nestjs/swagger';

export class NotificationPayload {
  @ApiProperty({
    description: 'User id who will receive the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'Your order has been successfully confirmed!',
  })
  message: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: ['email'],
    example: 'email',
  })
  type: 'email';

  @ApiProperty({
    description: 'Notification priority',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  priority: 'high' | 'medium' | 'low';
}
