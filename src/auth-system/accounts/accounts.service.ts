import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Account } from './entities/account.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { REQUEST } from '@nestjs/core';
import { Student } from 'src/students/entities/student.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { Role } from 'src/common/types/global.type';
import { generateRandomPassword } from 'src/utils/generatePassword';
import bcrypt from "bcryptjs";
import { PASSWORD_SALT_COUNT } from 'src/common/CONSTANTS';
import { AuthHelper } from '../auth/helpers/auth.helper';
import { User } from '../users/entities/user.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import { BranchesService } from 'src/branches/branches.service';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { RefreshTokenService } from '../auth/helpers/refresh-tokens.service';
import { LoginDevice } from './entities/login-devices.entity';
import { StreamClientProvider } from '../stream-client/stream-client-provider';
import { Image } from 'src/file-management/images/entities/image.entity';
import { ImagesService } from 'src/file-management/images/images.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { WebAuthnCredential } from '../webAuthn/entities/webAuthnCredential.entity';

@Injectable({ scope: Scope.REQUEST })
export class AccountsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly authHelper: AuthHelper,
    private readonly branchesService: BranchesService,
    private readonly utilitiesService: UtilitiesService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly streamClientProvider: StreamClientProvider,
    private readonly imagesService: ImagesService
  ) {
    super(dataSource, req);
  }

  // TODO: Actually the best approach would be to not create account directly, instead create EmailVerificationPending record, once verified then create account
  // But in this app, if account is not created at first, then we student, teacher can't be created
  async createAccount(entity: Teacher | Student | Staff, profileImage?: Image) {
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
        : Role.STAFF


    const account = this.getRepository<Account>(Account).create({
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: key,
      [key]: entity,
      profileImage: profileImage ?? null,
      password,
      prevPasswords: [bcrypt.hashSync(password, PASSWORD_SALT_COUNT)],
      branch: await this.branchesService.getBranch(branchId),
    });

    account.setLowerCasedFullName();

    const savedAccount = await this.getRepository(Account).save(account);

    // send account confirmation mail to the user, mail won't be sent if the account is staff
    return this.authHelper.sendEmailConfirmation(savedAccount);
  }

  async createAdminAccount(branch: Branch, dto: { firstName: string, lastName: string, email: string }) {
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
      password,
      prevPasswords: [bcrypt.hashSync(password, PASSWORD_SALT_COUNT)],
      branch,
    });

    account.setLowerCasedFullName();

    const createdAccount = await this.getRepository(Account).save(account);

    await this.authHelper.sendEmailConfirmation(createdAccount);

    return createdAccount
  }

  async update(id: string, dto: UpdateAccountDto) {
    const account = await this.getRepository(Account).findOne({
      where: { id },
      relations: { profileImage: true },
      select: { id: true, firstName: true, lastName: true, verifiedAt: true, profileImage: { id: true } }
    });

    if (!account) throw new NotFoundException('No associated account found');

    const image = await this.imagesService.update(account.profileImage?.id, dto.profileImageId);
    if (image !== undefined) account.profileImage = image;

    Object.assign(account, dto)

    account.setLowerCasedFullName();

    await this.getRepository(Account).save(account);
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

    const streamClient = this.streamClientProvider.getClient();

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
