import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminUserService } from './admin-user.service';
import {
  AdminAuthResponseDTO,
  AdminCreateDTO,
  AdminLoginDTO,
} from './dtos/admin-user.controller.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AdminUserEntity } from './entities/admin-user.entity';

@ApiTags('admin')
@Controller({ path: 'admins', version: '1' })
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Public()
  @Post()
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
  })
  async create(@Body() body: AdminCreateDTO): Promise<AdminUserEntity> {
    return this.adminUserService.create(body.login, body.password);
  }

  @Public()
  @Post('/auth')
  @ApiResponse({
    status: 200,
    description: 'Admin authenticated successfully',
    type: AdminAuthResponseDTO,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() body: AdminLoginDTO): Promise<AdminAuthResponseDTO> {
    const token = await this.adminUserService.validateAdmin(body);
    return { token };
  }
}
