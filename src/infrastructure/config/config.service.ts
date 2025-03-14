import { Injectable } from '@nestjs/common';
import { DatabaseConfig, JwtConfig } from './config.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get database(): DatabaseConfig {
    return {
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      username: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.database'),
    } as DatabaseConfig;
  }

  get jwt(): JwtConfig {
    return {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    } as JwtConfig;
  }
}
