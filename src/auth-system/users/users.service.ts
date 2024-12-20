import { Inject, Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Brackets, DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { UsersQueryDto } from './dto/user-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { User } from './entities/user.entity';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { userSelectCols } from './helpers/user-select-cols';
import { AuthUser } from 'src/common/types/global.type';
import { Account } from '../accounts/entities/account.entity';
import { ImagesService } from 'src/file-management/images/images.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Branch } from 'src/branches/entities/branch.entity';
import { AccountsService } from '../accounts/accounts.service';

@Injectable({ scope: Scope.REQUEST })
export class UsersService extends BaseRepository {
  constructor(
    private readonly datasource: DataSource,
    @Inject(REQUEST) req: FastifyRequest,
    private readonly imagesService: ImagesService,
    private readonly accountsService: AccountsService,
  ) { super(datasource, req) }

  async create(createUserDto: CreateUserDto) {
    const branch = await this.getRepository(Branch).findOne({
      where: { id: createUserDto.branchId },
      select: { id: true }
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const profileImage = createUserDto.profileImageId ? await this.imagesService.findOne(createUserDto.profileImageId) : null;

    const user = this.getRepository(User).create({
      branch,
      profileImage,
    });

    await this.getRepository(User).save(user);

    await this.accountsService.createAdminAccount(user, {
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName
    })

    return { message: 'User created' }
  }

  async findAll(queryDto: UsersQueryDto) {
    const queryBuilder = this.getRepository(User).createQueryBuilder('user');

    queryBuilder
      .orderBy("user.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .withDeleted()
      .leftJoin("user.account", "account")
      .leftJoin("user.profileImage", "profileImage")
      .andWhere(new Brackets(qb => {
        queryDto.role && qb.andWhere('account.role = :role', { role: queryDto.role });
      }))

    applySelectColumns(queryBuilder, userSelectCols, 'user');

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string): Promise<User> {
    const existing = await this.getRepository(User).findOne({
      where: { id },
      relations: {
        profileImage: true, account: true,
      },
      select: userSelectCols,
    })
    if (!existing) throw new NotFoundException('User not found');

    return existing;
  }

  async getUserByAccountId(accountId: string): Promise<User> {
    const user = await this.getRepository(User).findOne({
      where: {
        account: { id: accountId }
      },
      relations: {
        account: true
      },
      select: userSelectCols,
    })
    if (!user) throw new NotFoundException('User not found')

    return user;
  }

  async myDetails(currentUser: AuthUser) {
    return await this.getUserByAccountId(currentUser.accountId);
  }

  async update(updateUserDto: UpdateUserDto, currentUser: AuthUser) {
    const existingUser = await this.getUserByAccountId(currentUser.accountId);
    const existingAccount = await this.getRepository(Account).findOneBy({ id: currentUser.accountId });
    if (!existingAccount) throw new InternalServerErrorException('Unable to update the associated profile. Please contact support.');

    const profileImage = (updateUserDto.profileImageId && (existingUser.profileImage?.id !== updateUserDto.profileImageId || !existingUser.profileImage))
      ? await this.imagesService.findOne(updateUserDto.profileImageId)
      : existingUser.profileImage;

    // update user
    Object.assign(existingUser, {
      ...updateUserDto,
    });

    // assign profile image
    existingUser.profileImage = profileImage;

    await this.getRepository(User).save(existingUser);

    Object.assign(existingAccount, {
      firstName: updateUserDto.firstName || existingAccount.firstName,
      lastName: updateUserDto.lastName,
    })

    await this.getRepository(Account).save(existingAccount);

    return {
      message: 'Profile Updated'
    }
  }
}
