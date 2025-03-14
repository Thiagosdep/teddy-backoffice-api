import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserService } from './admin-user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminUserEntity } from './entities/AdminUser.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AdminLoginDTO } from './dtos/admin-user.controller.dto';
import * as bcrypt from 'bcrypt';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';
import { RedisService } from '../infrastructure/cache/redis/redis.service';
import { randomUUID } from 'crypto';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AdminUserService', () => {
  let service: AdminUserService;
  let jwtService: JwtService;
  let adminUserRepository: any;
  let redisService: any;
  let loggerService: any;

  const mockAdminUser = {
    id: randomUUID(),
    login: 'admin',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    // Create mock logger service
    loggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    // Create mock Redis service
    redisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: getRepositoryToken(
            AdminUserEntity,
            ConnectionNameEnum.READ_WRITE,
          ),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: WinstonLoggerService,
          useValue: loggerService,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<AdminUserService>(AdminUserService);
    jwtService = module.get<JwtService>(JwtService);
    adminUserRepository = module.get(
      getRepositoryToken(AdminUserEntity, ConnectionNameEnum.READ_WRITE),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAdmin', () => {
    it('should return a JWT token when credentials are valid', async () => {
      const loginDto: AdminLoginDTO = {
        login: 'admin',
        password: 'password123',
      };

      adminUserRepository.findOne.mockResolvedValue(mockAdminUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.validateAdmin(loginDto);

      expect(adminUserRepository.findOne).toHaveBeenCalledWith({
        where: { login: loginDto.login },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockAdminUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockAdminUser.id,
        username: mockAdminUser.login,
      });
      expect(result).toEqual('test-token');
    });

    it('should throw UnauthorizedException when admin not found', async () => {
      const loginDto: AdminLoginDTO = {
        login: 'nonexistent',
        password: 'password123',
      };

      adminUserRepository.findOne.mockResolvedValue(null);

      await expect(service.validateAdmin(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto: AdminLoginDTO = {
        login: 'admin',
        password: 'wrongpassword',
      };

      adminUserRepository.findOne.mockResolvedValue(mockAdminUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.validateAdmin(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('create', () => {
    it('should create a new admin user with hashed password', async () => {
      const login = 'newadmin';
      const password = 'newpassword';
      const hashedPassword = 'hashedNewPassword';
      const newAdmin = { id: 'new-uuid', login, password: hashedPassword };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      adminUserRepository.create.mockReturnValue(newAdmin);
      adminUserRepository.save.mockResolvedValue(newAdmin);

      const result = await service.create(login, password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(adminUserRepository.create).toHaveBeenCalledWith({
        login,
        password: hashedPassword,
      });
      expect(adminUserRepository.save).toHaveBeenCalledWith(newAdmin);
      expect(result).toEqual(newAdmin);
    });
  });

  describe('cacheUserIds', () => {
    it('should cache user IDs in Redis', async () => {
      const adminId = 'admin-uuid';
      const userIds = ['user-1', 'user-2', 'user-3'];

      await service.cacheUserIds(adminId, userIds);

      expect(redisService.set).toHaveBeenCalledWith(
        `admin:${adminId}:userIds`,
        userIds,
      );
    });
  });

  describe('getUserIds', () => {
    it('should return cached user IDs from Redis', async () => {
      const adminId = 'admin-uuid';
      const userIds = ['user-1', 'user-2', 'user-3'];

      redisService.get.mockResolvedValue(userIds);

      const result = await service.getUserIds(adminId);

      expect(redisService.get).toHaveBeenCalledWith(`admin:${adminId}:userIds`);
      expect(result).toEqual(userIds);
    });

    it('should return empty array when no cached user IDs found', async () => {
      const adminId = 'admin-uuid';

      redisService.get.mockResolvedValue(null);

      const result = await service.getUserIds(adminId);

      expect(redisService.get).toHaveBeenCalledWith(`admin:${adminId}:userIds`);
      expect(result).toEqual([]);
    });
  });
});
