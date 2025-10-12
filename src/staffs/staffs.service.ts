import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
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
import { UpdateAccountDto } from 'src/auth-system/accounts/dto/update-account.dto';
import { StaffUtilsService } from './helpers/staffs-utils.service';
import { EBookTransactionStatus } from 'src/common/types/global.type';
import { BookTransactionByMemberQueryDto } from 'src/library-system/book-transactions/dto/book-transactions-query.dto';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { FilesService } from 'src/file-management/files/files.service';

@Injectable({ scope: Scope.REQUEST })
export class StaffsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly accountsService: AccountsService,
    private readonly utilitiesService: UtilitiesService,
    private readonly staffUtilsService: StaffUtilsService,
    private readonly filesService: FilesService,
  ) { super(dataSource, req) }

  async create(createStaffDto: CreateStaffDto) {
    // check if staff already exists
    await this.checkIfStaffExists(createStaffDto);

    const profileImage = createStaffDto.profileImageId
      ? await this.imageService.findOne(createStaffDto.profileImageId)
      : null;

    const documentAttachments = createStaffDto.documentAttachmentIds
      ? await this.filesService.findAllByIds(createStaffDto.documentAttachmentIds)
      : [];

    const faculties = createStaffDto.facultyIds?.length ? await this.getRepository(Faculty).find({
      where: { id: In(createStaffDto.facultyIds) },
      select: { id: true }
    }) : [];

    const staff = this.getRepository(Staff).create({
      ...createStaffDto,
      staffId: await this.staffUtilsService.generateStaffId(),
      salaryStructure: this.getRepository(SalaryStructure).create({
        basicSalary: createStaffDto.basicSalary,
        allowances: createStaffDto.allowances ?? [],
      }),
      faculties,
      documentAttachments
    });
    // const savedStaff = await this.getRepository(Staff).save(staff); // auto created when account is created due to cascade

    // create account
    await this.accountsService.createAccount(staff, profileImage); // an account for staff is also created, because attendance records are stored in accounts

    return { message: 'Staff created' }
  }

  async findAll(queryDto: StaffQueryDto) {
    const queryBuilder = this.getRepository(Staff).createQueryBuilder('staff');

    queryBuilder
      .orderBy("staff.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('staff.account', 'account')
      .leftJoin("account.profileImage", "profileImage")
      .leftJoin('staff.faculties', 'faculties')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere(new Brackets(qb => {
          qb.orWhere("account.lowerCasedFullName LIKE LOWER(:search)", { search: `${queryDto.search}%` })
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
        account: { profileImage: true },
        faculties: true,
        documentAttachments: true,
      },
      select: {
        account: {
          id: true,
          profileImage: {
            id: true,
            url: true,
          },
        },
        faculties: {
          id: true,
          name: true,
        },
        documentAttachments: {
          id: true,
          originalName: true,
          url: true,
        }
      }
    });
    if (!existingStaff) throw new NotFoundException('Staff not found');

    return existingStaff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const existingStaff = await this.findOne(id);
    await this.checkIfStaffExists(updateStaffDto, existingStaff);

    if (updateStaffDto.facultyIds?.length) {
      const faculties = await this.getRepository(Faculty).find({
        where: { id: In(updateStaffDto.facultyIds) },
        select: { id: true }
      });

      existingStaff.faculties = faculties;
    }

    if (updateStaffDto.documentAttachmentIds?.length) {
      const newDocuments = await this.filesService.findAllByIds(updateStaffDto.documentAttachmentIds);
      existingStaff.documentAttachments = newDocuments;
    }

    // update account related details
    await this.accountsService.update(existingStaff.account?.id, updateStaffDto as UpdateAccountDto)

    Object.assign(existingStaff, { ...updateStaffDto });

    await this.getRepository(Staff).save(existingStaff);

    return { message: 'Staff updated' }
  }

  async checkIfStaffExists(staffDto: CreateStaffDto | UpdateStaffDto, staff?: Staff) {
    const { email, phone, accountNumber } = staffDto;

    const errorMsg = {
      email: { field: 'email', message: 'Staff with this email already exists' },
      phone: { field: 'phone', message: 'Staff with this phone already exists' },
      accountNumber: { field: 'accountNumber', message: 'Staff with this account number already exists' }
    }

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
      if (existingStaff.email === email) throw new ConflictException(errorMsg.email);
      if (existingStaff.phone === phone) throw new ConflictException(errorMsg.phone);
      if (existingStaff.accountNumber === accountNumber) throw new ConflictException(errorMsg.accountNumber);
    } else if (existingStaff && staff) {
      if (existingStaff.email === email && existingStaff.id !== staff.id) throw new ConflictException(errorMsg.email);
      if (existingStaff.phone === phone && existingStaff.id !== staff.id) throw new ConflictException(errorMsg.phone);
      if (existingStaff.accountNumber === accountNumber && existingStaff.id !== staff.id) throw new ConflictException(errorMsg.accountNumber);
    }
  }

  async delete(id: string) {
    const staff = await this.getRepository(Staff).findOne({
      where: { id },
      relations: { account: true },
      select: { id: true, staffId: true, payAmount: true, account: { id: true } }
    });

    if (!staff) throw new NotFoundException('Staff not found');

    // check if staff has any salary dues
    if (staff.payAmount > 0) {
      throw new BadRequestException('Cannot delete. This staff has salary pending. Please pay the salary first.');
    }

    await this.getRepository(Account).remove(staff.account); // deleting account will cascade delete the staff record

    return { message: 'Staff removed' };

  }
}
