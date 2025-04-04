import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import {
  ConnectionNameEnum,
  databaseProviders,
} from './infrastructure/database/database.provider';
import { AppConfigModule } from './infrastructure/config/config.module';
import { AdminUserModule } from './admin-user/admin-user.module';
import { AuthModule } from './auth/auth.module';
import { ObservabilityModule } from './infrastructure/observability/observability.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { UserNotificationModule } from './user-notification/user-notification.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRootAsync(
      databaseProviders(ConnectionNameEnum.READ_WRITE),
    ),
    AppConfigModule,
    AdminUserModule,
    AuthModule,
    ObservabilityModule,
    QueueModule,
    UserNotificationModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService, UserService],
})
export class AppModule {}
