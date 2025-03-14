import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserService } from './admin-user.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserEntity } from './entities/AdminUser.entity';
import { AuthModule } from '../auth/auth.module';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';
import { ObservabilityModule } from '../infrastructure/observability/observability.module';

const typeOrmFeatureConfig = [
  TypeOrmModule.forFeature([AdminUserEntity], ConnectionNameEnum.READ_WRITE),
];

@Module({
  imports: [...typeOrmFeatureConfig, AuthModule, ObservabilityModule],
  providers: [AdminUserService],
  controllers: [AdminUserController],
  exports: [AdminUserService, ...typeOrmFeatureConfig],
})
export class AdminUserModule {}
