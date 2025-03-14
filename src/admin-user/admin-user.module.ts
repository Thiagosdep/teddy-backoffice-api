import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserService } from './admin-user.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserEntity } from './entities/admin-user.entity';
import { AuthModule } from '../auth/auth.module';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';

const typeOrmFeatureConfig = [
  TypeOrmModule.forFeature([AdminUserEntity], ConnectionNameEnum.ONLY_READ),
  TypeOrmModule.forFeature([AdminUserEntity], ConnectionNameEnum.READ_WRITE),
];

@Module({
  imports: [...typeOrmFeatureConfig, AuthModule],
  providers: [AdminUserService],
  controllers: [AdminUserController],
  exports: [AdminUserService, ...typeOrmFeatureConfig],
})
export class AdminUserModule {}
