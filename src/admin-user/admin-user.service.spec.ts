import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserService } from './admin-user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminUserEntity } from './entities/AdminUser.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AdminLoginDTO } from './dtos/admin-user.controller.dto';
import * as bcrypt from 'bcrypt';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let jwtService: JwtService;
  let adminUserRepository: any;

  const mockAdminUser = {
    id: 'test-uuid',
    login: 'admin',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<AdminUserService>(AdminUserService);
    jwtService = module.get<JwtService>(JwtService);
    adminUserRepository = module.get(
      getRepositoryToken(AdminUserEntity, ConnectionNameEnum.READ_WRITE),
    );
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

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));
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
});
