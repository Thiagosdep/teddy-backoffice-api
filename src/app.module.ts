import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './infrastructure/logger/logger.module';
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

@Module({
  imports: [
    LoggerModule,
    UserModule,
    TypeOrmModule.forRootAsync(
      databaseProviders(ConnectionNameEnum.READ_WRITE),
    ),
    AppConfigModule,
    AdminUserModule,
    AuthModule,
    ObservabilityModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService, UserService],
})
export class AppModule {}
