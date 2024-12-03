import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common';
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
import { PASSWORD_SALT_COUNT, thisSchool } from 'src/common/CONSTANTS';
import { accountSelectCols } from './helpers/account-select-cols.config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailEvents } from 'src/mail/mail.service';
import { UserCredentialsEventDto } from 'src/mail/dto/events.dto';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.REQUEST })
export class AccountsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @InjectRepository(Account) private accountsRepo: Repository<Account>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super(dataSource, req);
  }

  async createAccount(entity: Teacher | Student | Guardian | Staff) {
    // check for existing
    const existingAccount = await this.accountsRepo.findOne({ where: { email: entity.email }, select: { id: true } });
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
      isVerified: true,
      password,
      prevPasswords: [bcrypt.hashSync(password, PASSWORD_SALT_COUNT)],
    });

    console.log({
      entityType: entity.constructor.name,
      password,
      email: entity.email
    });

    await this.getRepository(Account).save(account);

    // send mail
    this.eventEmitter.emit(MailEvents.USER_CREDENTIALS, new UserCredentialsEventDto({
      email: entity.email,
      password,
      schoolName: thisSchool.name,
      schoolAddress: thisSchool.address,
      username: entity.firstName + ' ' + entity.lastName,
      schoolLogo: thisSchool.logo,
      clientUrl: this.configService.get<string>('CLIENT_URL'),
    }));
  }

  async me(currentUser: AuthUser) {
    const account = await this.getRepository(Account).findOne({
      where: { id: currentUser.accountId },
      select: accountSelectCols,
    });
    if (!account) throw new Error('Account not found');

    return account;
  }

  async findOne(id: string) {
    const existingAccount = await this.accountsRepo.findOneBy({ id });
    if (!existingAccount) throw new Error('Account not found');

    return existingAccount;
  }
}
