import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './entities/User.entity';
import { UserCompanyEntity } from './entities/UserCompany.entity';
import { CreateUserDTO, UpdateUserDTO } from './dtos/user.controller.dto';
import { ConnectionNameEnum } from '../infrastructure/database/database.provider';
import { PaginationResponse } from '../common/types/pagination.type';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity, ConnectionNameEnum.ONLY_READ)
    private readonly userReaderRepository: Repository<UserEntity>,
    @InjectDataSource(ConnectionNameEnum.READ_WRITE)
    private readonly dataSource: DataSource,
  ) {}

  async get(id: string): Promise<UserEntity> {
    const user = await this.userReaderRepository.findOne({
      where: { id },
      relations: ['userCompanies'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserEntity(user);
  }

  async getAll(params: {
    offset: number;
    limit: number;
  }): Promise<PaginationResponse<UserEntity>> {
    const { offset, limit } = params;

    const [users, total] = await this.userReaderRepository.findAndCount({
      skip: offset,
      take: limit,
      relations: ['userCompanies'],
    });

    if (total < offset) {
      throw new NotFoundException('Out of bounds');
    }

    return {
      data: users,
      total,
      offset,
      limit,
    };
  }

  async create(user: CreateUserDTO): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const userRepository =
        transactionalEntityManager.getRepository(UserEntity);
      const userCompanyWriterRepository =
        transactionalEntityManager.getRepository(UserCompanyEntity);

      const findUserByEmail = await this.userReaderRepository.findOne({
        where: { email: user.email },
      });

      if (findUserByEmail) {
        throw new ConflictException('User already exists');
      }

      const newUser = userRepository.create({
        name: user.name,
        email: user.email,
        ownRemuneration: user.own_remuneration,
      });

      const savedUser = await userRepository.save(newUser);

      const newUserCompany = userCompanyWriterRepository.create({
        name: user.company_name,
        companyValue: user.company_value,
        user: savedUser,
      });

      await userCompanyWriterRepository.save(newUserCompany);
    });
  }

  async patchUpdate(id: string, user: UpdateUserDTO): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const foundUser = await transactionalEntityManager.findOne(UserEntity, {
        where: { id },
        relations: ['userCompanies'],
      });

      if (!foundUser) {
        throw new NotFoundException('User not found');
      }

      if (user.email) {
        const existingUser = await transactionalEntityManager.findOne(
          UserEntity,
          {
            where: { email: user.email },
          },
        );
        if (existingUser && existingUser.id !== id) {
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
        for (const companyUpdate of user.user_company) {
          if (!companyUpdate.id) {
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
    });
  }
}
