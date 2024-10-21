import { Inject, Injectable, Scope } from '@nestjs/common';
import { UpdateAccountDto } from './dto/update-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { REQUEST } from '@nestjs/core';
import { Student } from 'src/students/entities/student.entity';
import { Guardian } from 'src/guardians/entities/guardian.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { AuthUser, Role } from 'src/common/types/global.type';
import { generateRandomPassword } from 'src/utils/generatePassword';
import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT_COUNT } from 'src/common/CONSTANTS';
import { accountSelectCols } from './helpers/account-select-cols.config';

@Injectable({ scope: Scope.REQUEST })
export class AccountsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @InjectRepository(Account) private accountsRepo: Repository<Account>,
  ) {
    super(dataSource, req);
  }

  async createAccount(entity: Teacher | Student | Guardian | Staff) {
    const password = generateRandomPassword();
    const key = entity instanceof Teacher
      ? Role.TEACHER
      : entity instanceof Student
        ? Role.STUDENT
        : entity instanceof Staff ?
          Role.STAFF
          : Role.GUARDIAN;

    const account = this.getRepository<Account>(Account).create({
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: key,
      [key]: entity,
      isVerified: true,
      password,
      prevPasswords: [bcrypt.hashSync(password, PASSWORD_SALT_COUNT)],
    })

    console.log({
      entityType: entity.constructor.name,
      password,
      email: entity.email
    })

    // TODO: send email to user

    await this.getRepository(Account).save(account);

    return {
      message: 'Account created successfully',
    }
  }

  async me(currentUser: AuthUser) {
    const account = await this.getRepository(Account).findOne({
      where: { id: currentUser.accountId },
      select: accountSelectCols,
    });
    if (!account) throw new Error('Account not found');

    return account;
  }

  findAll() {
    return `This action returns all accounts`;
  }

  async findOne(id: string) {
    const existingAccount = await this.accountsRepo.findOneBy({ id });
    if (!existingAccount) throw new Error('Account not found');

    return existingAccount;
  }

  update(id: string, updateAccountDto: UpdateAccountDto) {
    return `This action updates a #${id} account`;
  }

  remove(id: string) {
    return `This action removes a #${id} account`;
  }
}
