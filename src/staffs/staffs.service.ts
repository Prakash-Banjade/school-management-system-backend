import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';
import { Brackets, DataSource, In, Not } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { FastifyRequest } from 'fastify';
import { StaffQueryDto } from './dto/staff-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { staffsColumnsConfig } from './helpers/staff-select-cols.config';
import { SalaryStructure } from 'src/finance-system/salary-management/salary-structures/entities/salary-structure.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { Faculty } from 'src/faculties/entities/faculty.entity';

@Injectable({ scope: Scope.REQUEST })
export class StaffsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly accountsService: AccountsService,
    private readonly utilitiesService: UtilitiesService,
  ) {
    super(dataSource, req);
  }

  async create(createStaffDto: CreateStaffDto) {
    // check if staff already exists
    await this.checkIfStaffExists(createStaffDto);

    const profileImage = createStaffDto.profileImageId
      ? await this.imageService.findOne(createStaffDto.profileImageId)
      : null;

    const faculties = createStaffDto.facultyIds?.length ? await this.getRepository(Faculty).find({
      where: { id: In(createStaffDto.facultyIds) },
      select: { id: true }
    }) : [];

    const staff = this.getRepository(Staff).create({
      ...createStaffDto,
      profileImage,
      salaryStructure: this.getRepository(SalaryStructure).create({
        basicSalary: createStaffDto.basicSalary,
        allowances: createStaffDto.allowances ?? [],
      }),
      faculties
    });
    const savedStaff = await this.getRepository(Staff).save(staff);

    // create account
    await this.accountsService.createAccount(savedStaff);

    return { message: 'Staff created' }
  }

  async findAll(queryDto: StaffQueryDto) {
    const queryBuilder = this.getRepository(Staff).createQueryBuilder('staff');

    queryBuilder
      .orderBy("staff.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin("staff.profileImage", "profileImage")
      .leftJoin('staff.account', 'account')
      .leftJoin('staff.faculties', 'faculties')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere(new Brackets(qb => {
          qb.orWhere("LOWER(CONCAT(staff.firstName, ' ', staff.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
            .orWhere("staff.staffId = :exactSearch", { exactSearch: queryDto.search })
        }))

        queryDto.type?.length && qb.andWhere('staff.type IN (:...type)', { type: queryDto.type });
        queryDto.departmentIds?.length && qb.andWhere('faculties.id IN (:...departmentIds)', { departmentIds: queryDto.departmentIds })
      }))

    applySelectColumns(queryBuilder, staffsColumnsConfig, 'staff');
    this.utilitiesService.applyBranchFilter(queryBuilder);

    return paginatedData(queryDto, queryBuilder);
  }

  async getOptions(queryDto: StaffQueryDto) {
    const queryBuilder = this.getRepository(Staff).createQueryBuilder('staff')
      .orderBy("staff.createdAt", queryDto.order)
      .leftJoin("staff.account", "account")
      .where(new Brackets(qb => {
        queryDto.type?.length && qb.andWhere('staff.type IN (:...type)', { type: queryDto.type });
      }))
      .select([
        "staff.id as value",
        "CONCAT(staff.firstName, ' ', staff.lastName) as label",
      ]);

    this.utilitiesService.applyBranchFilter(queryBuilder);

    return queryBuilder.getRawMany();
  }

  async findOne(id: string) {
    const existingStaff = await this.getRepository(Staff).findOne({
      where: {
        id,
        account: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      relations: {
        profileImage: true,
        account: true,
        faculties: true,
      },
      select: {
        profileImage: {
          id: true,
          url: true,
          originalName: true,
        },
        account: { id: true },
        faculties: {
          id: true,
          name: true,
        }
      }
    });
    if (!existingStaff) throw new NotFoundException('Staff not found');

    return existingStaff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const existingStaff = await this.findOne(id);
    await this.checkIfStaffExists(updateStaffDto, existingStaff);

    // evaluate profile image
    if (existingStaff.profileImage?.id && updateStaffDto.profileImageId !== undefined) {
      await this.imageService.update(existingStaff.profileImage.id, updateStaffDto.profileImageId);
    } else if (updateStaffDto.profileImageId !== undefined) { // this will execute only when teacher has no profile image before
      existingStaff.profileImage = updateStaffDto.profileImageId ? await this.imageService.findOne(updateStaffDto.profileImageId) : null; // setting new profile image
      await this.accountsService.updateProfileImage(existingStaff.account?.id, existingStaff.profileImage);
    }

    const faculties = updateStaffDto.facultyIds?.length ? await this.getRepository(Faculty).find({
      where: { id: In(updateStaffDto.facultyIds) },
      select: { id: true }
    }) : [];

    // update email if provided
    if (updateStaffDto.email && existingStaff.email !== updateStaffDto.email) {
      await this.accountsService.updateEmail(existingStaff.account?.id, updateStaffDto.email);
    }

    Object.assign(existingStaff, { ...updateStaffDto, faculties });

    await this.getRepository(Staff).save(existingStaff);

    return { message: 'Staff updated' }
  }

  async checkIfStaffExists(staffDto: CreateStaffDto | UpdateStaffDto, staff?: Staff) {
    const { email, phone, accountNumber } = staffDto;

    const existingStaff = await this.getRepository(Staff).createQueryBuilder('staff')
      .where({ id: staff?.id ? Not(staff.id) : undefined })
      .where(new Brackets(qb => {
        qb.where([
          { email },
          { phone },
          { accountNumber }
        ])
      })).getOne();

    if (existingStaff && !staff) {
      if (existingStaff.email === email) throw new BadRequestException('Staff with this email already exists');
      if (existingStaff.phone === phone) throw new BadRequestException('Staff with this phone already exists');
      if (existingStaff.accountNumber === accountNumber) throw new BadRequestException('Staff with this accountNumber already exists');
    } else if (existingStaff && staff) {
      if (existingStaff.email === email && existingStaff.id !== staff.id) throw new BadRequestException('Staff with this email already exists');
      if (existingStaff.phone === phone && existingStaff.id !== staff.id) throw new BadRequestException('Staff with this phone already exists');
      if (existingStaff.accountNumber === accountNumber && existingStaff.id !== staff.id) throw new BadRequestException('Staff with this accountNumber already exists');
    }
  }
}
