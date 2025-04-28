import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { Attendance } from './entities/attendance.entity';
import { Brackets, DataSource } from 'typeorm';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { AuthUser, EAttendanceStatus, Role } from 'src/common/types/global.type';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { attendanceSelectCols } from './helpers/attendance-select-cols.config';
import { UpdateAttendanceBatchDto } from './dto/update-attendance-batch.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { isAdmin } from 'src/utils/utils';

@Injectable({ scope: Scope.REQUEST })
export class AttendancesService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
  ) { super(datasource, req) }

  async create(createAttendanceDto: CreateAttendanceDto) {
    const account = await this.getAccount(createAttendanceDto.accountId);

    const attendance = this.getRepository(Attendance).create({
      ...createAttendanceDto,
      account
    });

    await this.getRepository(Attendance).save(attendance);

    return {
      message: 'Attendance created successfully',
    }
  }

  private async getAccount(accountId: string) {
    const account = await this.getRepository(Account).findOne({
      where: { id: accountId },
      select: { id: true }
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async findAll(queryDto: AttendanceQueryDto, currentUser: AuthUser) {
    const queryBuilder = this.getRepository(Attendance).createQueryBuilder('attendance');

    const accountId = isAdmin(currentUser) ? queryDto.accountId : currentUser.accountId;

    queryBuilder
      .orderBy("attendance.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin("attendance.account", "account")
      .andWhere(new Brackets(qb => {
        queryDto.status && qb.andWhere('attendance.status = :status', { status: queryDto.status })
        queryDto.month && qb.andWhere('MONTH(attendance.date) = :month', { month: queryDto.month });

        if (accountId) qb.andWhere('account.id = :accountId', { accountId })
      }));

    applySelectColumns(queryBuilder, attendanceSelectCols, 'attendance');

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(Attendance).findOneBy({ id });
    if (!existing) throw new NotFoundException('Attendance not found');

    return existing;
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    const { status, outTime } = updateAttendanceDto;
    if (!status && !outTime) throw new BadRequestException('Status or outTime required');

    const existing = await this.findOne(id);

    updateAttendanceDto.status && (existing.status = status);
    updateAttendanceDto.outTime && (existing.outTime = outTime);

    await this.getRepository(Attendance).save(existing);

    return { message: 'Attendance updated successfully' }
  }

  async updateInBatch(updateAttendanceBatchDto: UpdateAttendanceBatchDto) {
    const attendancesToRemove = updateAttendanceBatchDto.updatedAttendances?.map(attendance => attendance.status === null ? attendance.id : null).filter(Boolean);

    // TODO: if teacher is updating the attendance, make sure he is the class teacher
    
    const attendances = await Promise.all(updateAttendanceBatchDto.updatedAttendances.filter(a => a.status !== null)?.map(async attendance => {
      if (!!attendance?.outTime && !attendance?.inTime) throw new BadRequestException('There must be in time to have out time.')

      if (attendance.id) { // update existing
        const existing = await this.findOne(attendance.id);
        Object.assign(existing, {
          ...attendance,
          inTime: existing.inTime || !!attendance?.inTime, // if there is inTime already, it can't be updated
          status: !!attendance?.inTime ? EAttendanceStatus.PRESENT : attendance.status
        });
        return existing;
      } else { // create new
        const account = await this.getAccount(attendance.accountId);
        return this.getRepository(Attendance).create({
          ...attendance,
          status: !!attendance?.inTime ? EAttendanceStatus.PRESENT : attendance.status,
          account
        });
      }
    }));

    await this.getRepository(Attendance).save(attendances);
    await this.remove(attendancesToRemove);

    return {
      message: 'Attendances updated successfully',
    }
  }
  async remove(ids: string[]) {
    if (!ids.length) return;
    await this.getRepository(Attendance).delete(ids);
  }
}
