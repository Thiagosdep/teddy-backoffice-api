import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/User.entity';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';
import { UserCompanyEntity } from './entities/UserCompany.entity';
import { ObservabilityModule } from '../infrastructure/observability/observability.module';

const typeOrmFeatureConfig = [
  TypeOrmModule.forFeature(
    [UserEntity, UserCompanyEntity],
    ConnectionNameEnum.READ_WRITE,
  ),
];
@Module({
  imports: [...typeOrmFeatureConfig, ObservabilityModule],
  controllers: [UserController],
  exports: [UserService, ...typeOrmFeatureConfig],
  providers: [UserService],
})
export class UserModule {}
