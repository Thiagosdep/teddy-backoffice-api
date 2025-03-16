import { Body, Controller, Post, Get, Request } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminUserService } from './admin-user.service';
import {
  AdminAuthResponseDTO,
  AdminCreateDTO,
  AdminLoginDTO,
  AdminUserIdsDTO,
} from './dtos/admin-user.controller.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AdminUserEntity } from './entities/AdminUser.entity';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';

@ApiTags('admin')
@Controller({ path: 'admins', version: '1' })
export class AdminUserController {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Public()
  @Post()
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
  })
  async create(@Body() body: AdminCreateDTO): Promise<AdminUserEntity> {
    this.logger.log(
      `Creating new admin with login=${body.login}`,
      'AdminUserController',
    );
    const result = await this.adminUserService.create(
      body.login,
      body.password,
    );
    this.logger.log(
      `Admin created successfully with login=${body.login}`,
      'AdminUserController',
    );
    return result;
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
    this.logger.log(
      `Admin login attempt for login=${body.login}`,
      'AdminUserController',
    );
    const token = await this.adminUserService.validateAdmin(body);
    this.logger.log(
      `Admin authenticated successfully for login=${body.login}`,
      'AdminUserController',
    );
    return { token };
  }

  @Post('/users/select')
  @ApiResponse({
    status: 200,
    description: 'User id cached successfully',
  })
  async cacheUserId(
    @Body() body: { userId: string },
    @Request() req,
  ): Promise<{ success: boolean }> {
    const adminId = req.user.sub;
    this.logger.log(
      `Caching user id=${body.userId} for admin ID=${adminId}`,
      'AdminUserController',
    );

    await this.adminUserService.cacheUserId(adminId, body.userId);

    this.logger.log(
      `Successfully cached user id for admin ID=${adminId}`,
      'AdminUserController',
    );

    return { success: true };
  }

  @Post('/users/remove')
  @ApiResponse({
    status: 200,
    description: 'User id removed from cache successfully',
  })
  async removeUserId(
    @Body() body: { userId: string },
    @Request() req,
  ): Promise<{ success: boolean }> {
    const adminId = req.user.sub;
    this.logger.log(
      `Removing user id=${body.userId} from cache for admin ID=${adminId}`,
      'AdminUserController',
    );

    await this.adminUserService.removeUserId(adminId, body.userId);

    this.logger.log(
      `Successfully removed user id for admin ID=${adminId}`,
      'AdminUserController',
    );

    return { success: true };
  }

  @Get('/users/select')
  @ApiResponse({
    status: 200,
    description: 'Get cached user ids for admin',
    type: AdminUserIdsDTO,
  })
  async getUserIds(@Request() req): Promise<AdminUserIdsDTO> {
    const adminId = req.user.sub;
    this.logger.log(
      `Retrieving cached user ids for admin ID=${adminId}`,
      'AdminUserController',
    );

    const userIds = await this.adminUserService.getUserIds(adminId);

    this.logger.log(
      `Retrieved ${userIds.length} cached user ids for admin ID=${adminId}`,
      'AdminUserController',
    );

    return { userIds };
  }
}
