import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { UserEntity } from '../../user/entities/User.entity';
import { UserCompanyEntity } from '../../user/entities/UserCompany.entity';
import { AdminUserEntity } from '../../admin-user/entities/admin-user.entity';

export enum ConnectionNameEnum {
  READ_WRITE = 'READ_WRITE',
  ONLY_READ = 'ONLY_READ',
}

export const databaseProviders = (
  connectionName: ConnectionNameEnum,
): TypeOrmModuleAsyncOptions => {
  return {
    name: connectionName,
    imports: [AppConfigModule],
    useFactory: (appConfigService: AppConfigService) => {
      const {
        hostReadWrite,
        hostOnlyRead,
        port,
        username,
        password,
        database,
      } = appConfigService.database;
      const host =
        connectionName === ConnectionNameEnum.READ_WRITE
          ? hostReadWrite
          : hostOnlyRead;
      return {
        name: connectionName,
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        entities: [UserEntity, UserCompanyEntity, AdminUserEntity],
        synchronize: false,
        logging: false,
      };
    },
    inject: [AppConfigService],
  };
};
