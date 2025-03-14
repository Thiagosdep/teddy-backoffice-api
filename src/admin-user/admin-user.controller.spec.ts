import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import {
  AdminCreateDTO,
  AdminLoginDTO,
} from './dtos/admin-user.controller.dto';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let service: AdminUserService;

  const mockAdminUser = {
    id: 'test-uuid',
    login: 'admin',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: AdminUserService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockAdminUser),
            validateAdmin: jest.fn().mockResolvedValue('jwt-token'),
          },
        },
        {
          provide: WinstonLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminUserController>(AdminUserController);
    service = module.get<AdminUserService>(AdminUserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new admin user', async () => {
      const createDto: AdminCreateDTO = {
        login: 'newadmin',
        password: 'password123',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockAdminUser);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(
        createDto.login,
        createDto.password,
      );
      expect(result).toEqual(mockAdminUser);
    });
  });

  describe('login', () => {
    it('should return a token when login is successful', async () => {
      const loginDto: AdminLoginDTO = {
        login: 'admin',
        password: 'password123',
      };
      const token = 'jwt-token';

      jest.spyOn(service, 'validateAdmin').mockResolvedValue(token);

      const result = await controller.login(loginDto);

      expect(service.validateAdmin).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({ token });
    });
  });
});
