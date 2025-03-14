import { Injectable } from '@nestjs/common';
import { DatabaseConfig } from './config.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get database(): DatabaseConfig {
    return {
      hostOnlyRead: this.configService.get<string>('database.hostOnlyRead'),
      hostReadWrite: this.configService.get<string>('database.hostReadWrite'),
      port: this.configService.get<number>('database.port'),
      username: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.database'),
    } as DatabaseConfig;
  }
}
