import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';
import { Brackets, DataSource, IsNull, Not, Or } from 'typeorm';
import { ImagesService } from 'src/images/images.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseRepository } from 'src/core/repository/base.repository';
import { StaffQueryDto } from './dto/staff-query.dto';
import paginatedData from 'src/core/utils/paginatedData';
import { Deleted } from 'src/core/dto/query.dto';

@Injectable({ scope: Scope.REQUEST })
export class StaffsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: Request,
    private readonly imageService: ImagesService,
    private readonly accountsService: AccountsService,
  ) {
    super(dataSource, req);
  }

  async create(createStaffDto: CreateStaffDto) {
    // check if staff already exists
    await this.checkIfStaffExists(createStaffDto);

    const profileImage = createStaffDto.profileImageId
      ? await this.imageService.findOne(createStaffDto.profileImageId)
      : null;

    const staff = this.getRepository(Staff).create({
      ...createStaffDto,
      profileImage
    });
    const savedStaff = await this.getRepository(Staff).save(staff);

    // create account
    await this.accountsService.createAccount(savedStaff);

    return this.staffMutationReturn(savedStaff, 'created');
  }

  async findAll(queryDto: StaffQueryDto) {
    const queryBuilder = this.getRepository(Staff).createQueryBuilder('staff');

    const deletedAt = queryDto.deleted === Deleted.ONLY ? Not(IsNull()) : queryDto.deleted === Deleted.NONE ? IsNull() : Or(IsNull(), Not(IsNull()));

    queryBuilder
      .orderBy("staff.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .withDeleted()
      .where({ deletedAt })
      .leftJoinAndSelect("staff.profileImage", "profileImage")
      // .leftJoinAndSelect('staff.account', 'account')
      // .leftJoinAndSelect('account.user', 'user')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.orWhere("LOWER(CONCAT(staff.firstName, ' ', staff.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    // applySelectColumns(queryBuilder, staffsColumnsConfig, 'staff');

    return paginatedData(queryDto, queryBuilder);

  }

  async findOne(id: string) {
    const existingStaff = await this.getRepository(Staff).findOne({
      where: { id },
      relations: {
        profileImage: true
      },
      select: {
        profileImage: {
          id: true,
          url: true
        }
      }
    });
    if (!existingStaff) throw new NotFoundException('Staff not found');

    return existingStaff;
  }

  async findOneByUserId(userId: string): Promise<Staff | null> {
    const existingStaff = await this.getRepository(Staff).findOne({
      where: { account: { user: { id: userId } } },
    })

    return existingStaff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const existingStaff = await this.findOne(id);
    await this.checkIfStaffExists(updateStaffDto, existingStaff);

    const profileImage = ((updateStaffDto.profileImageId && updateStaffDto.profileImageId !== existingStaff.profileImage?.id) || !existingStaff.profileImage)
      ? await this.imageService.findOne(updateStaffDto.profileImageId)
      : null;

    Object.assign(existingStaff, { ...updateStaffDto });

    existingStaff.profileImage = profileImage;

    return this.staffMutationReturn(await this.getRepository(Staff).save(existingStaff), 'updated');
  }

  async remove(id: string) {
    const existingStaff = await this.findOne(id);

    return this.staffMutationReturn(await this.getRepository(Staff).remove(existingStaff), 'deleted');
  }

  async checkIfStaffExists(staffDto: CreateStaffDto | UpdateStaffDto, staff?: Staff) {
    const { staffId, email, phone, accountNumber } = staffDto;

    const existingStaff = await this.getRepository(Staff).createQueryBuilder('staff')
      .where({ id: staff?.id ? Not(staff.id) : undefined })
      .where(new Brackets(qb => {
        qb.where([
          { staffId },
          { email },
          { phone },
          { accountNumber }
        ])
      })).getOne();

    if (existingStaff && !staff) {
      if (existingStaff.staffId === staffId) throw new BadRequestException('Staff with this staffId already exists');
      if (existingStaff.email === email) throw new BadRequestException('Staff with this email already exists');
      if (existingStaff.phone === phone) throw new BadRequestException('Staff with this phone already exists');
      if (existingStaff.accountNumber === accountNumber) throw new BadRequestException('Staff with this accountNumber already exists');
    } else if (existingStaff && staff) {
      if (existingStaff.staffId === staffId && existingStaff.id !== staff.id) throw new BadRequestException('Staff with this staffId already exists');
      if (existingStaff.email === email && existingStaff.id !== staff.id) throw new BadRequestException('Staff with this email already exists');
      if (existingStaff.phone === phone && existingStaff.id !== staff.id) throw new BadRequestException('Staff with this phone already exists');
      if (existingStaff.accountNumber === accountNumber && existingStaff.id !== staff.id) throw new BadRequestException('Staff with this accountNumber already exists');
    }
  }

  private staffMutationReturn = (staff: Staff, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Staff created successfully' : type === 'deleted' ? 'Staff deleted successfully' : 'Staff updated successfully',
      staff: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
      }
    }
  }
}
