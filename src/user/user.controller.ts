import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserDTO,
} from './dtos/user.controller.dto';
import { UserService } from './user.service';
import { UserAdapter } from './adapters/user.adapter';
import { PaginationResponse } from '../common/types/pagination.type';
import { validatePaginationQuery } from '../common/types/pagination.type';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';
import { UserEntity } from './entities/User.entity';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    isArray: true,
    type: UserDTO,
  })
  @ApiResponse({ status: 404, description: 'Out of bounds' })
  async getAll(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ): Promise<PaginationResponse<UserDTO>> {
    this.logger.log(
      `Getting all users with offset=${offset}, limit=${limit}`,
      'UserController',
    );

    const { validatedLimit, validatedOffset } = validatePaginationQuery(
      limit,
      offset,
    );

    const response = await this.userService.getAll({
      limit: validatedLimit,
      offset: validatedOffset,
    });

    this.logger.log(
      `Retrieved ${response.data.length} users`,
      'UserController',
    );

    return {
      data: response.data.map((user) => UserAdapter.toUserDTO(user)),
      total: response.total,
      offset: response.offset,
      limit: response.limit,
    };
  }

  @Get('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The id of the user to retrieve',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserDTO,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async get(@Param('id') id: string): Promise<UserDTO> {
    this.logger.log(`Getting user with id=${id}`, 'UserController');
    const user = await this.userService.get(id);
    return UserAdapter.toUserDTO(user);
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() user: CreateUserDTO): Promise<void> {
    this.logger.log(
      `Creating new user with email=${user.email}`,
      'UserController',
    );
    await this.userService.create(user);
    this.logger.log(
      `User created successfully with email=${user.email}`,
      'UserController',
    );
  }

  @Patch('/:id')
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({
    status: 400,
    description: 'company_id is required for update',
  })
  async update(
    @Param('id') id: string,
    @Body() user: UpdateUserDTO,
  ): Promise<void> {
    this.logger.log(`Updating user with id=${id}`, 'UserController');
    await this.userService.patchUpdate(id, user);
    this.logger.log(
      `User updated successfully with id=${id}`,
      'UserController',
    );
  }

  @Delete('/:id')
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting user with id=${id}`, 'UserController');
    await this.userService.delete(id);
    this.logger.log(
      `User deleted successfully with id=${id}`,
      'UserController',
    );
  }

  @Post('/batch')
  @ApiResponse({
    status: 201,
    description: 'Users created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBatch(
    @Body() body: { userIds: string[] },
  ): Promise<UserEntity[]> {
    this.logger.log(
      `Getting batch of users with ids=${body.userIds.toString()}`,
      'UserController',
    );
    return this.userService.getBatch(body.userIds);
  }
}
