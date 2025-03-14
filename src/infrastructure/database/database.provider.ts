import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { UserEntity } from '../../user/entities/User.entity';
import { UserCompanyEntity } from '../../user/entities/UserCompany.entity';
import { AdminUserEntity } from '../../admin-user/entities/admin-user.entity';

export enum ConnectionNameEnum {
  READ_WRITE = 'READ_WRITE',
}

export const databaseProviders = (
  connectionName: ConnectionNameEnum,
): TypeOrmModuleAsyncOptions => {
  return {
    name: connectionName,
    imports: [AppConfigModule],
    useFactory: (appConfigService: AppConfigService) => {
      const { host, port, username, password, database } =
        appConfigService.database;
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
