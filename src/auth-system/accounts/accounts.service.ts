import { BadRequestException, ConflictException, Inject, Injectable, Scope } from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { Account } from './entities/account.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { REQUEST } from '@nestjs/core';
import { Student } from 'src/students/entities/student.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { Role } from 'src/common/types/global.type';
import { generateRandomPassword } from 'src/utils/generatePassword';
import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT_COUNT } from 'src/common/CONSTANTS';
import { AuthHelper } from '../auth/helpers/auth.helper';
import { User } from '../users/entities/user.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import { BranchesService } from 'src/branches/branches.service';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable({ scope: Scope.REQUEST })
export class AccountsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly authHelper: AuthHelper,
    private readonly branchesService: BranchesService,
    private readonly utilitiesService: UtilitiesService,
  ) {
    super(dataSource, req);
  }

  // TODO: Actually the best approach would be to not create account directly, instead create EmailVerificationPending record, once verified then create account
  // But in this app, if account is not created at first, then we student, teacher can't be created
  async createAccount(entity: Teacher | Student | Staff) {
    const branchId = this.utilitiesService.getBranchId();

    // check for existing
    const existingAccount = await this.getRepository(Account).findOne({ where: { email: entity.email }, select: { id: true } });
    if (existingAccount) throw new BadRequestException({
      message: 'Duplicate email. Please use different email.',
      field: 'email',
    });

    // create account by generating random password
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
      password,
      prevPasswords: [bcrypt.hashSync(password, PASSWORD_SALT_COUNT)],
      branch: await this.branchesService.getBranch(branchId),
    });

    await this.getRepository(Account).save(account);

    // send account confirmation mail to the user
    return this.authHelper.sendEmailConfirmation({
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
    } as Account);
  }

  async createAdminAccount(user: User, branch: Branch, dto: { firstName: string, lastName: string, email: string }) {
    const existingAccount = await this.getRepository(Account).findOne({ where: { email: dto.email }, select: { id: true } });
    if (existingAccount) throw new BadRequestException({
      message: 'Duplicate email. Please use different email.',
      field: 'email',
    });

    const password = generateRandomPassword();

    const account = this.getRepository<Account>(Account).create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: Role.ADMIN,
      user,
      password,
      prevPasswords: [bcrypt.hashSync(password, PASSWORD_SALT_COUNT)],
      branch,
    });
    await this.getRepository(Account).save(account);

    return this.authHelper.sendEmailConfirmation({
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
    } as Account);
  }

  async findOne(id: string) {
    const existingAccount = await this.getRepository(Account).findOneBy({ id });
    if (!existingAccount) throw new Error('Account not found');

    return existingAccount;
  }

  async updateEmail(accountId: string, newEmail: string) {
    // check if email is taken
    const accountWithEmail = await this.getRepository(Account).findOne({
      where: {
        email: newEmail,
        id: Not(accountId)
      },
    });
    if (accountWithEmail) throw new ConflictException('This email is already taken');

    await this.getRepository(Account).update({ id: accountId }, { email: newEmail });
  }
}
