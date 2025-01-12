import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { DataSource, IsNull, Not } from 'typeorm';
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
import { RefreshTokenService } from '../auth/helpers/refresh-tokens.service';
import { LoginDevice } from './entities/login-devices.entity';
import { WebAuthnCredential } from '../webAuthn/entities/webAuthnCredential.entity';
import { StreamClient } from '@stream-io/node-sdk';
import { EnvService } from 'src/env/env.service';

@Injectable({ scope: Scope.REQUEST })
export class AccountsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly authHelper: AuthHelper,
    private readonly branchesService: BranchesService,
    private readonly utilitiesService: UtilitiesService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly envService: EnvService,
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

  async getDevices() {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const loginDevices = await this.getRepository(LoginDevice).find({
      where: { account: { id: accountId } },
      order: { lastLogin: 'DESC' },
      select: { id: true, deviceId: true, ua: true, firstLogin: true, lastActivityRecord: true },
    });

    this.refreshTokenService.init({});
    const tokens = await this.refreshTokenService.getAll(); // this will return all the refresh tokens of the current user

    return loginDevices
      .map((device: any) => ({
        ...device,
        signedIn: tokens.some((token) => token.deviceId === device.deviceId),
      }));
  }

  async revokeDevice(deviceId: string) {
    const { email, deviceId: currentDeviceId, accountId } = this.utilitiesService.getCurrentUser();

    if (deviceId === currentDeviceId) throw new BadRequestException('Cannot revoke current device');

    const device = await this.getRepository(LoginDevice).findOne({
      where: { deviceId, account: { id: accountId } },
      select: { id: true },
    });

    if (device) {
      await this.getRepository(LoginDevice).save({
        ...device,
        isTrusted: false,
      });
    }

    this.refreshTokenService.init({
      deviceId,
      email: email
    });
    await this.refreshTokenService.remove();

    // remove credentials
    await this.getRepository(WebAuthnCredential).delete({ account: { id: accountId } });

    return { message: 'Device signed out' };
  }

  async get2FaStatus() {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const account = await this.getRepository(Account).findOne({
      where: { id: accountId },
      select: { id: true, twoFaEnabledAt: true }
    });

    if (!account) throw new NotFoundException('No associated account found');

    return {
      twoFaEnabledAt: account.twoFaEnabledAt
    }
  }

  async toggle2Fa(enable2Fa: boolean) {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const account = await this.getRepository(Account).findOne({
      where: { id: accountId },
      select: { id: true, verifiedAt: true, twoFaEnabledAt: true }
    });

    if (!account) throw new NotFoundException('No associated account found');

    account.twoFaEnabledAt = enable2Fa ? new Date() : null;

    await this.getRepository(Account).save(account);

    return;
  }

  async getStreamToken() {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const streamClient = new StreamClient(this.envService.STREAM_VIDEO_API_KEY, this.envService.STREAM_VIDEO_API_SECRET);

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

    const issuedAt = Math.floor(Date.now() / 1000) - 60; // subtract 1 minute

    const token = streamClient.generateUserToken({
      user_id: accountId,
      exp: expirationTime,
      iat: issuedAt,
      validity_in_seconds: 60 * 60,
    });

    return token;
  }
}
