import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';

describe('UserController', () => {
  let controller: UserController;
  let userServiceMock: {
    get: jest.Mock;
    getAll: jest.Mock;
    create: jest.Mock;
    patchUpdate: jest.Mock;
    delete: jest.Mock;
  };

  const mockUserId = randomUUID();
  const mockUser = {
    id: mockUserId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    ownRemuneration: 1000,
    userCompanies: [
      {
        id: randomUUID(),
        name: 'Company Name',
        companyValue: 1000,
        active: true,
      },
    ],
  };

  const mockUserDto = {
    id: mockUserId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    own_remuneration: 1000,
    user_companies: [
      {
        id: mockUser.userCompanies[0].id,
        name: 'Company Name',
        company_value: 1000,
        active: true,
      },
    ],
  };

  const mockCreateUserDto = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    own_remuneration: 1000,
    company_name: 'Company Name',
    company_value: 1000,
  };

  const mockUpdateUserDto = {
    name: 'John Doe Updated',
    email: 'john.doe@example.com',
    own_remuneration: 1500,
    user_company: [
      {
        id: mockUser.userCompanies[0].id,
        name: 'Updated Company Name',
        company_value: 1500,
        active: true,
      },
    ],
  };

  beforeEach(async () => {
    userServiceMock = {
      get: jest.fn(),
      getAll: jest.fn(),
      create: jest.fn(),
      patchUpdate: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
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

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get', () => {
    it('should throw an error if the user does not exist', async () => {
      userServiceMock.get.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.get(mockUserId)).rejects.toThrow(
        'User not found',
      );
      expect(userServiceMock.get).toHaveBeenCalledWith(mockUserId);
    });

    it('should return user by id', async () => {
      userServiceMock.get.mockResolvedValue(mockUser);

      const response = await controller.get(mockUserId);

      expect(response).toEqual(mockUserDto);
      expect(userServiceMock.get).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getAll', () => {
    it('should return paginated users with search parameter', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: randomUUID(), email: 'jane@example.com' },
      ];

      const paginationResponse = {
        data: users,
        total: users.length,
        offset: 0,
        limit: 10,
      };

      userServiceMock.getAll.mockResolvedValue(paginationResponse);

      const result = await controller.getAll(0, 10, 'John');

      expect(result).toEqual({
        data: users.map((user) =>
          expect.objectContaining({
            id: user.id,
            name: user.name,
            email: user.email,
            own_remuneration: user.ownRemuneration,
          }),
        ),
        total: users.length,
        offset: 0,
        limit: 10,
      });

      expect(userServiceMock.getAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        search: 'John',
        userIds: undefined,
      });
    });

    it('should return users by userIds', async () => {
      const userIds = JSON.stringify([randomUUID(), randomUUID()]);
      const users = [
        mockUser,
        { ...mockUser, id: userIds[1], email: 'jane@example.com' },
      ];

      const paginationResponse = {
        data: users,
        total: users.length,
        offset: 0,
        limit: 10,
      };

      userServiceMock.getAll.mockResolvedValue(paginationResponse);

      const result = await controller.getAll(
        undefined,
        undefined,
        undefined,
        userIds,
      );

      expect(result).toEqual({
        data: users.map((user) =>
          expect.objectContaining({
            id: user.id,
            name: user.name,
            email: user.email,
            own_remuneration: user.ownRemuneration,
          }),
        ),
        total: users.length,
        offset: 0,
        limit: 10,
      });

      expect(userServiceMock.getAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        search: undefined,
        userIds,
      });
    });

    it('should throw an error if pagination is out of bounds', async () => {
      userServiceMock.getAll.mockRejectedValue(
        new NotFoundException('Out of bounds'),
      );

      await expect(controller.getAll(100, 10)).rejects.toThrow('Out of bounds');
      expect(userServiceMock.getAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 100,
      });
    });
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      userServiceMock.create.mockResolvedValue(undefined);

      await expect(
        controller.create(mockCreateUserDto),
      ).resolves.toBeUndefined();
      expect(userServiceMock.create).toHaveBeenCalledWith(mockCreateUserDto);
    });

    it('should throw an error if the user already exists', async () => {
      userServiceMock.create.mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(
        'User already exists',
      );
      expect(userServiceMock.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      userServiceMock.patchUpdate.mockResolvedValue(undefined);

      await expect(
        controller.update(mockUserId, mockUpdateUserDto),
      ).resolves.toBeUndefined();
      expect(userServiceMock.patchUpdate).toHaveBeenCalledWith(
        mockUserId,
        mockUpdateUserDto,
      );
    });

    it('should throw an error if the user does not exist', async () => {
      userServiceMock.patchUpdate.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.update(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow('User not found');
      expect(userServiceMock.patchUpdate).toHaveBeenCalledWith(
        mockUserId,
        mockUpdateUserDto,
      );
    });

    it('should throw an error if the email is already in use', async () => {
      userServiceMock.patchUpdate.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(
        controller.update(mockUserId, { email: 'existing.email@example.com' }),
      ).rejects.toThrow('Email already in use');
      expect(userServiceMock.patchUpdate).toHaveBeenCalledWith(mockUserId, {
        email: 'existing.email@example.com',
      });
    });

    it('should throw an error if company_id is missing for update', async () => {
      userServiceMock.patchUpdate.mockRejectedValue(
        new BadRequestException('company_id is required for update'),
      );

      const invalidUpdateDto = {
        user_company: [{ name: 'Company without id' }],
      };

      await expect(
        controller.update(mockUserId, invalidUpdateDto),
      ).rejects.toThrow('company_id is required for update');
      expect(userServiceMock.patchUpdate).toHaveBeenCalledWith(
        mockUserId,
        invalidUpdateDto,
      );
    });
  });

  describe('delete', () => {
    it('should delete a user successfully', async () => {
      userServiceMock.delete.mockResolvedValue(undefined);

      await expect(controller.delete(mockUserId)).resolves.toBeUndefined();
      expect(userServiceMock.delete).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw an error if the user does not exist', async () => {
      userServiceMock.delete.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.delete(mockUserId)).rejects.toThrow(
        'User not found',
      );
      expect(userServiceMock.delete).toHaveBeenCalledWith(mockUserId);
    });
  });
});
