import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from './auth-system/users/entities/user.entity';
import { Account } from './auth-system/accounts/entities/account.entity';
import { Branch } from './branches/entities/branch.entity';
import { Faculty } from './faculties/entities/faculty.entity';
import { AcademicYear } from './academic-years/entities/academic-year.entity';
import { ChargeHead, EChargeHeadPeriod } from './finance-system/fee-management/charge-heads/entities/charge-head.entity';
import { Role } from './common/types/global.type';
import { CACHE_KEYS, CHARGE_HEADS, PASSWORD_SALT_COUNT } from './common/CONSTANTS';
import bcrypt from 'bcryptjs';
import { endOfYear, startOfYear } from 'date-fns';
import { startOfDayString } from './utils/utils';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  getHello(): string {
    return 'Hello World!';
  }

  async seed() {
    if (this.configService.get('NODE_ENV') === 'production') return;

    const userRepo = this.dataSource.getRepository(User);
    const accountRepo = this.dataSource.getRepository(Account);
    const branchRepo = this.dataSource.getRepository(Branch);
    const facultyRepo = this.dataSource.getRepository(Faculty);
    const academicYearRepo = this.dataSource.getRepository(AcademicYear);
    const chargeHeadRepo = this.dataSource.getRepository(ChargeHead);

    // Create default branch
    const branch = branchRepo.create({
      name: 'Default',
      address: 'Default',
      description: 'This branch is created by default',
    });
    await branchRepo.save(branch);

    // Create default faculty
    const faculty = facultyRepo.create({
      name: 'School Level',
    });
    await facultyRepo.save(faculty);

    // Create super admin
    const account = accountRepo.create({
      email: "abhyam@gmail.com",
      password: "AbhyamGroup",
      firstName: "Abhyam",
      lastName: "Group",
      role: Role.SUPER_ADMIN,
      prevPasswords: [bcrypt.hashSync("AbhyamGroup", PASSWORD_SALT_COUNT)],
      user: userRepo.create({}),
      verifiedAt: new Date(),
    })
    account.setLowerCasedFullName();
    await accountRepo.save(account);

    // Create default academic year
    const academicYear = academicYearRepo.create({
      startDate: startOfDayString(startOfYear(new Date())),
      endDate: startOfDayString(endOfYear(new Date())),
      name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      isActive: true,
    });
    const newAcademicYear = await academicYearRepo.save(academicYear);
    await this.cacheManager.set(CACHE_KEYS.CAY_ID, newAcademicYear.id, 0); // update cache

    // Create mandatory charge heads
    const mandatoryHeads: Partial<ChargeHead>[] = [
      {
        name: CHARGE_HEADS.admissionFee,
        description: 'Admission fee for the class room',
        isMandatory: true,
        period: EChargeHeadPeriod.One_Time,
        order: 1,
      },
      {
        name: CHARGE_HEADS.monthlyFee,
        description: 'Monthly fee for the class room',
        isMandatory: true,
        period: EChargeHeadPeriod.Monthly,
        order: 2,
      },
      {
        name: CHARGE_HEADS.transportationFee,
        description: 'Transportation fee of the student',
        isMandatory: true,
        period: EChargeHeadPeriod.Monthly,
        order: 3,
      },
      {
        name: CHARGE_HEADS.libraryFine,
        description: 'Library fine of the student',
        isMandatory: true,
        period: EChargeHeadPeriod.None,
        order: 4,
      }
    ]

    await chargeHeadRepo
      .createQueryBuilder()
      .insert()
      .values(mandatoryHeads)
      .orIgnore() // This will skip the record if the unique constraint fails
      .execute();

    return '✅ Seeding completed';
  }
}
