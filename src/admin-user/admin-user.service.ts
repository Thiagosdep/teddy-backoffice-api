import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserEntity } from './entities/AdminUser.entity';
import { AdminLoginDTO } from './dtos/admin-user.controller.dto';
import * as bcrypt from 'bcrypt';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(AdminUserEntity, ConnectionNameEnum.READ_WRITE)
    private adminUserWriteRepository: Repository<AdminUserEntity>,
    private jwtService: JwtService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async validateAdmin(loginDto: AdminLoginDTO): Promise<string> {
    const { login, password } = loginDto;
    this.logger.log(`Validating admin with login=${login}`, 'AdminUserService');

    const admin = await this.adminUserWriteRepository.findOne({
      where: { login },
    });

    if (!admin) {
      this.logger.error(
        `Invalid credentials for login=${login}`,
        undefined,
        'AdminUserService',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      this.logger.error(
        `Invalid password for login=${login}`,
        undefined,
        'AdminUserService',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id, username: admin.login };
    this.logger.log(
      `Admin authenticated successfully with login=${login}`,
      'AdminUserService',
    );
    return this.jwtService.sign(payload);
  }

  async create(login: string, password: string): Promise<AdminUserEntity> {
    this.logger.log(
      `Creating new admin with login=${login}`,
      'AdminUserService',
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = this.adminUserWriteRepository.create({
      login,
      password: hashedPassword,
    });

    const result = await this.adminUserWriteRepository.save(admin);
    this.logger.log(
      `Admin created successfully with id=${result.id}`,
      'AdminUserService',
    );
    return result;
  }
}
