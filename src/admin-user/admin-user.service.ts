import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserEntity } from './entities/AdminUser.entity';
import { AdminLoginDTO } from './dtos/admin-user.controller.dto';
import * as bcrypt from 'bcrypt';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(AdminUserEntity, ConnectionNameEnum.READ_WRITE)
    private adminUserWriteRepository: Repository<AdminUserEntity>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(loginDto: AdminLoginDTO): Promise<string> {
    const { login, password } = loginDto;

    const admin = await this.adminUserWriteRepository.findOne({
      where: { login },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id, username: admin.login };
    return this.jwtService.sign(payload);
  }

  async create(login: string, password: string): Promise<AdminUserEntity> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = this.adminUserWriteRepository.create({
      login,
      password: hashedPassword,
    });

    return this.adminUserWriteRepository.save(admin);
  }
}
