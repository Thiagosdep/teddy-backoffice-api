import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { UserEntity } from './entities/User.entity';
import { UserCompanyEntity } from './entities/UserCompany.entity';
import { CreateUserDTO, UpdateUserDTO } from './dtos/user.controller.dto';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';
import { PaginationResponse } from '../common/types/pagination.type';
import { WinstonLoggerService } from '../infrastructure/observability/logger/winston-logger.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity, ConnectionNameEnum.READ_WRITE)
    private readonly userReaderRepository: Repository<UserEntity>,
    @InjectDataSource(ConnectionNameEnum.READ_WRITE)
    private readonly dataSource: DataSource,
    private readonly logger: WinstonLoggerService,
  ) {}

  async get(id: string): Promise<UserEntity> {
    this.logger.log(`Fetching user with id=${id}`, 'UserService');

    const user = await this.userReaderRepository.findOne({
      where: { id },
      relations: ['userCompanies'],
    });

    if (!user) {
      this.logger.error(
        `User not found with id=${id}`,
        undefined,
        'UserService',
      );
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User found with id=${id}`, 'UserService');
    return new UserEntity(user);
  }

  async getAll(params: {
    offset?: number;
    limit?: number;
    search?: string;
    userIds?: string[];
  }): Promise<PaginationResponse<UserEntity>> {
    const { offset = 0, limit = 10, search, userIds } = params;

    this.logger.log(
      `Fetching users with offset=${offset}, limit=${limit}, search=${search || 'none'}, userIds=${userIds?.length || 0}`,
      'UserService',
    );

    let queryBuilder = this.userReaderRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userCompanies', 'userCompanies')
      .orderBy('user.name', 'ASC');

    if (userIds && userIds.length > 0) {
      queryBuilder = queryBuilder.andWhere('user.id IN (:...userIds)', {
        userIds,
      });
    } else {
      if (search) {
        queryBuilder = queryBuilder.andWhere('user.name ILIKE :search', {
          search: `%${search}%`,
        });
      }

      queryBuilder = queryBuilder.skip(offset).take(limit);
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    if (total < offset && total > 0) {
      this.logger.error(
        `Out of bounds: offset=${offset}, total=${total}`,
        undefined,
        'UserService',
      );
      throw new NotFoundException('Out of bounds');
    }

    this.logger.log(
      `Found ${users.length} users out of ${total} total`,
      'UserService',
    );

    return {
      data: users.map((user) => new UserEntity(user)),
      total,
      offset,
      limit,
    };
  }

  async create(user: CreateUserDTO): Promise<void> {
    this.logger.log(
      `Creating new user with email=${user.email}`,
      'UserService',
    );

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const userRepository =
        transactionalEntityManager.getRepository(UserEntity);
      const userCompanyWriterRepository =
        transactionalEntityManager.getRepository(UserCompanyEntity);

      const findUserByEmail = await this.userReaderRepository.findOne({
        where: { email: user.email },
      });

      if (findUserByEmail) {
        this.logger.error(
          `User already exists with email=${user.email}`,
          undefined,
          'UserService',
        );
        throw new ConflictException('User already exists');
      }

      const newUser = userRepository.create({
        name: user.name,
        email: user.email,
        ownRemuneration: user.own_remuneration,
      });

      const savedUser = await userRepository.save(newUser);
      this.logger.log(`User saved with id=${savedUser.id}`, 'UserService');

      const newUserCompany = userCompanyWriterRepository.create({
        name: user.company_name,
        companyValue: user.company_value,
        user: savedUser,
      });

      await userCompanyWriterRepository.save(newUserCompany);
      this.logger.log(
        `User company created for user id=${savedUser.id}`,
        'UserService',
      );
    });
  }

  async patchUpdate(id: string, user: UpdateUserDTO): Promise<void> {
    this.logger.log(`Updating user with id=${id}`, 'UserService');

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const foundUser = await transactionalEntityManager.findOne(UserEntity, {
        where: { id },
        relations: ['userCompanies'],
      });

      if (!foundUser) {
        this.logger.error(
          `User not found with id=${id}`,
          undefined,
          'UserService',
        );
        throw new NotFoundException('User not found');
      }

      if (user.email) {
        this.logger.log(
          `Checking if email=${user.email} is already in use`,
          'UserService',
        );
        const existingUser = await transactionalEntityManager.findOne(
          UserEntity,
          {
            where: { email: user.email },
          },
        );
        if (existingUser && existingUser.id !== id) {
          this.logger.error(
            `Email already in use: ${user.email}`,
            undefined,
            'UserService',
          );
          throw new ConflictException('Email already in use');
        }
      }

      if (user.name) {
        foundUser.name = user.name;
      }

      if (user.own_remuneration) {
        foundUser.ownRemuneration = user.own_remuneration;
      }

      if (user.email) {
        foundUser.email = user.email;
      }

      const promises: Promise<UserCompanyEntity>[] = [];

      if (user.user_company?.length) {
        this.logger.log(
          `Updating ${user.user_company.length} companies for user id=${id}`,
          'UserService',
        );

        for (const companyUpdate of user.user_company) {
          if (!companyUpdate.id) {
            this.logger.error(
              'company_id is required for update',
              undefined,
              'UserService',
            );
            throw new BadRequestException('company_id is required for update');
          }
          const company = foundUser.userCompanies.find(
            (c) => c.id === companyUpdate.id,
          );
          if (company) {
            if (companyUpdate.company_value !== undefined) {
              company.companyValue = companyUpdate.company_value;
            }
            if (companyUpdate.name !== undefined) {
              company.name = companyUpdate.name;
            }
            if (companyUpdate.active !== undefined) {
              company.active = companyUpdate.active;
            }
            promises.push(transactionalEntityManager.save(company));
          }
        }
      }

      await Promise.all([
        ...promises,
        transactionalEntityManager.save(foundUser),
      ]);

      this.logger.log(`User updated successfully with id=${id}`, 'UserService');
    });
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting user with id=${id}`, 'UserService');

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const foundUser = await transactionalEntityManager.findOne(UserEntity, {
        where: { id },
      });

      if (!foundUser) {
        this.logger.error(
          `User not found with id=${id}`,
          undefined,
          'UserService',
        );
        throw new NotFoundException('User not found');
      }

      await transactionalEntityManager.softDelete(UserEntity, id);
      this.logger.log(`User soft deleted with id=${id}`, 'UserService');
    });
  }

  async getBatch(ids: string[]): Promise<UserEntity[]> {
    this.logger.log(
      `Fetching batch of users with ids=${ids.toString()}`,
      'UserService',
    );

    if (!ids || ids.length === 0) {
      this.logger.warn('Empty batch request received', 'UserService');
      return [];
    }

    const users = await this.userReaderRepository.find({
      where: { id: In(ids) },
      relations: ['userCompanies'],
    });

    if (users.length !== ids.length) {
      const foundIds = users.map((user) => user.id);
      const missingIds = ids.filter((id) => !foundIds.includes(id));
      this.logger.error(
        `Some users not found: ${missingIds.toString()}`,
        undefined,
        'UserService',
      );
      throw new NotFoundException('One or more users not found');
    }

    this.logger.log(
      `Found ${users.length} users in batch request`,
      'UserService',
    );
    return users.map((user) => new UserEntity(user));
  }
}
