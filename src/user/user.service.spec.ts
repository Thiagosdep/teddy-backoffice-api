import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserEntity } from './entities/User.entity';
import { UserCompanyEntity } from './entities/UserCompany.entity';
import { DataSource, Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { randomUUID } from 'crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateUserDTO } from './dtos/user.controller.dto';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';

describe('UserService', () => {
  const date = new Date();
  let userService: UserService;
  let userReaderRepository: Repository<UserEntity>;
  let dataSource: DataSource;

  beforeEach(async () => {
    userReaderRepository = createMock<Repository<UserEntity>>();
    dataSource = createMock<DataSource>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(
            UserEntity,
            ConnectionNameEnum.READ_WRITE,
          ),
          useValue: userReaderRepository,
        },
        {
          provide: getDataSourceToken(ConnectionNameEnum.READ_WRITE),
          useValue: dataSource,
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

    userService = module.get<UserService>(UserService);

    jest
      .spyOn(dataSource, 'transaction')
      .mockImplementation(async (cb: any) => {
        const userRepository = createMock<Repository<UserEntity>>();
        const userCompanyRepository =
          createMock<Repository<UserCompanyEntity>>();

        const transactionalEntityManager = {
          getRepository: (entity) => {
            if (entity === UserEntity) return userRepository;
            if (entity === UserCompanyEntity) return userCompanyRepository;
            return null;
          },
          findOne: jest.fn(),
          save: jest.fn(),
        };

        return cb(transactionalEntityManager);
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('get', () => {
    it('should return a user entity if the user is found', async () => {
      // Given
      const userId = randomUUID();
      const mockUser = new UserEntity({
        id: userId,
        name: 'John Doe',
        email: 'johndoe@email.com',
        createdAt: date,
        updatedAt: date,
        userCompanies: [],
      });

      // When
      jest.spyOn(userReaderRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await userService.get(userId);

      // Then
      expect(userReaderRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['userCompanies'],
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if the user is not found', async () => {
      // Given
      const userId = randomUUID();
      jest.spyOn(userReaderRepository, 'findOne').mockResolvedValue(null);

      // When / Then
      await expect(userService.get(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(userReaderRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['userCompanies'],
      });
    });
  });

  describe('create', () => {
    it('should create a new user with company', async () => {
      // Given
      const userId = randomUUID();
      const createUserDto = {
        name: 'John Doe',
        email: 'johndoe@email.com',
        own_remuneration: 1000,
        company_name: 'Company Name',
        company_value: 1000,
      };

      const mockUser = {
        id: userId,
        name: createUserDto.name,
        email: createUserDto.email,
        ownRemuneration: createUserDto.own_remuneration,
      };
      const mockCompany = {
        name: createUserDto.company_name,
        companyValue: createUserDto.company_value,
        user: mockUser,
      };

      // Setup mocks
      jest.spyOn(userReaderRepository, 'findOne').mockResolvedValue(null);

      const userRepository = {
        create: jest.fn().mockReturnValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUser),
      };

      const userCompanyRepository = {
        create: jest.fn().mockReturnValue(mockCompany),
        save: jest.fn().mockResolvedValue(mockCompany),
      };

      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb: any) => {
          const transactionalEntityManager = {
            getRepository: (entity) => {
              if (entity === UserEntity) return userRepository;
              if (entity === UserCompanyEntity) return userCompanyRepository;
              return null;
            },
          };
          return cb(transactionalEntityManager);
        });

      // When
      await userService.create(createUserDto);

      // Then
      expect(userReaderRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        email: createUserDto.email,
        ownRemuneration: createUserDto.own_remuneration,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(userCompanyRepository.create).toHaveBeenCalledWith({
        name: createUserDto.company_name,
        companyValue: createUserDto.company_value,
        user: mockUser,
      });
      expect(userCompanyRepository.save).toHaveBeenCalledWith(mockCompany);
    });

    it('should throw ConflictException if the user already exists', async () => {
      // Given
      const createUserDto = {
        name: 'John Doe',
        email: 'johndoe@email.com',
        own_remuneration: 1000,
        company_name: 'Company Name',
        company_value: 1000,
      };

      jest
        .spyOn(userReaderRepository, 'findOne')
        .mockResolvedValue({ id: randomUUID() } as UserEntity);

      // When / Then
      await expect(userService.create(createUserDto)).rejects.toThrow(
        new ConflictException('User already exists'),
      );
      expect(userReaderRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  describe('patchUpdate', () => {
    it('should update user details', async () => {
      // Given
      const userId = randomUUID();
      const updateUserDto: UpdateUserDTO = {
        name: 'Updated Name',
        email: 'updated@email.com',
        own_remuneration: 2000,
      };

      const mockUser = new UserEntity({
        id: userId,
        name: 'John Doe',
        email: 'johndoe@email.com',
        ownRemuneration: 1000,
        userCompanies: [],
      });

      const mockEntityManager = {
        findOne: jest.fn().mockImplementation((entity, options) => {
          if (entity === UserEntity && options.where.id === userId) {
            return Promise.resolve(mockUser);
          }
          if (
            entity === UserEntity &&
            options.where.email === updateUserDto.email
          ) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        }),
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          name: updateUserDto.name,
          email: updateUserDto.email,
          ownRemuneration: updateUserDto.own_remuneration,
        }),
      };

      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb: any) => {
          return cb(mockEntityManager);
        });

      // When
      await userService.patchUpdate(userId, updateUserDto);

      // Then
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, {
        where: { id: userId },
        relations: ['userCompanies'],
      });
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, {
        where: { email: updateUserDto.email },
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          name: updateUserDto.name,
          email: updateUserDto.email,
          ownRemuneration: updateUserDto.own_remuneration,
        }),
      );
    });

    it('should throw NotFoundException if user not found during update', async () => {
      // Given
      const userId = randomUUID();
      const updateUserDto: UpdateUserDTO = {
        name: 'Updated Name',
      };

      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb: any) => {
          return cb(mockEntityManager);
        });

      // When / Then
      await expect(
        userService.patchUpdate(userId, updateUserDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, {
        where: { id: userId },
        relations: ['userCompanies'],
      });
    });

    it('should throw ConflictException if email already in use by another user', async () => {
      // Given
      const userId = randomUUID();
      const anotherUserId = randomUUID();
      const updateUserDto: UpdateUserDTO = {
        email: 'existing@email.com',
      };

      const mockUser = new UserEntity({
        id: userId,
        name: 'John Doe',
        email: 'johndoe@email.com',
        userCompanies: [],
      });

      const existingUser = new UserEntity({
        id: anotherUserId,
        name: 'Another User',
        email: 'existing@email.com',
      });

      const mockEntityManager = {
        findOne: jest.fn().mockImplementation((entity, options) => {
          if (entity === UserEntity && options.where.id === userId) {
            return Promise.resolve(mockUser);
          }
          if (
            entity === UserEntity &&
            options.where.email === updateUserDto.email
          ) {
            return Promise.resolve(existingUser);
          }
          return Promise.resolve(null);
        }),
      };

      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb: any) => {
          return cb(mockEntityManager);
        });

      // When / Then
      await expect(
        userService.patchUpdate(userId, updateUserDto),
      ).rejects.toThrow(new ConflictException('Email already in use'));
    });

    it('should update user company details', async () => {
      // Given
      const userId = randomUUID();
      const companyId = randomUUID();
      const updateUserDto: UpdateUserDTO = {
        user_company: [
          {
            id: companyId,
            name: 'Updated Company',
            company_value: 2000,
            active: false,
          },
        ],
      };

      const mockCompany = new UserCompanyEntity({
        id: companyId,
        name: 'Company Name',
        companyValue: 1000,
        active: true,
      });

      const mockUser = new UserEntity({
        id: userId,
        name: 'John Doe',
        email: 'johndoe@email.com',
        ownRemuneration: 1000,
        userCompanies: [mockCompany],
      });

      const updatedCompany = {
        ...mockCompany,
        name: 'Updated Company',
        companyValue: 2000,
        active: false,
      };

      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        save: jest.fn().mockImplementation((entity) => {
          if (entity.id === companyId) {
            return Promise.resolve(updatedCompany);
          }
          return Promise.resolve(mockUser);
        }),
      };

      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb: any) => {
          return cb(mockEntityManager);
        });

      // When
      await userService.patchUpdate(userId, updateUserDto);

      // Then
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, {
        where: { id: userId },
        relations: ['userCompanies'],
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: companyId,
          name: 'Updated Company',
          companyValue: 2000,
          active: false,
        }),
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('delete', () => {
    it('should delete a user successfully', async () => {
      const userId = randomUUID();
      const mockUser = new UserEntity({ id: userId });

      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        softDelete: jest.fn().mockResolvedValue(undefined),
      };

      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb: any) => {
          return cb(mockEntityManager);
        });

      await userService.delete(userId);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, {
        where: { id: userId },
      });

      expect(mockEntityManager.softDelete).toHaveBeenCalledWith(
        UserEntity,
        userId,
      );
    });
  });
});
