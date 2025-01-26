import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './dto/update-leave-request.dto';
import { LeaveRequest } from './entities/leave-request.entity';
import { Brackets, DataSource } from 'typeorm';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { AuthUser, ELeaveRequestStatus, Role } from 'src/common/types/global.type';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { employeesLeaveRequestSelectCols, leaveRequestSelectCols } from './helpers/leave-requests-select-cols.config';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceEvent } from 'src/attendances/helpers/attendances.helper';
import { CreateLeaveAttendanceEvent } from 'src/attendances/dto/create-attendance.dto';
import { isAdmin, isStudent, startOfDayString } from 'src/utils/utils';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable({ scope: Scope.REQUEST })
export class LeaveRequestsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly eventEmitter: EventEmitter2,
    private readonly utilitiesService: UtilitiesService,
  ) { super(dataSource, req) }

  async create(createLeaveRequestDto: CreateLeaveRequestDto, currentUser: AuthUser) {
    const account = await this.getAccount(currentUser.accountId);

    const newLeaveRequest = this.getRepository(LeaveRequest).create({
      ...createLeaveRequestDto,
      account
    });

    await this.getRepository(LeaveRequest).save(newLeaveRequest);

    return {
      message: 'Leave request applied successfully. You will be notified once it has been approved.',
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

  async findAll(queryDto: LeaveRequestQueryDto, currentUser: AuthUser) { // only for students leave request
    const querybuilder = this.getRepository(LeaveRequest).createQueryBuilder('leaveRequest');

    querybuilder
      .orderBy('leaveRequest.createdAt', queryDto.order)
      .take(queryDto.take)
      .skip(queryDto.skip)
      .leftJoin('leaveRequest.account', 'account')
      .leftJoin('account.student', 'student')
      .leftJoin('student.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('classRoom.faculty', 'faculty')
      .andWhere(new Brackets(qb => {
        if (isAdmin(currentUser)) { // admin access
          queryDto.classRoomId && qb.andWhere(new Brackets(qb => {
            qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
            qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
          }));

          queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });
          queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });
          queryDto.status?.length && qb.andWhere('leaveRequest.status IN (:...status)', { status: Array.isArray(queryDto.status) ? queryDto.status : [queryDto.status] });

          qb.andWhere('account.role = :role', { role: Role.STUDENT }); // only for students

        } else if (isStudent(currentUser)) {
          qb.andWhere('account.id = :accountId', { accountId: currentUser.accountId })
        }
      }));

    applySelectColumns(querybuilder, leaveRequestSelectCols, 'leaveRequest');
    this.utilitiesService.applyBranchFilter(querybuilder, 'classRoom.branchId = :branchId');

    return paginatedData(queryDto, querybuilder);
  }

  async getEmployeeLeaveRequests(queryDto: LeaveRequestQueryDto) {
    const querybuilder = this.getRepository(LeaveRequest).createQueryBuilder('leaveRequest');

    querybuilder
      .orderBy('leaveRequest.createdAt', queryDto.order)
      .take(queryDto.take)
      .skip(queryDto.skip)
      .leftJoin('leaveRequest.account', 'account')
      .leftJoin('account.teacher', 'teacher')
      .leftJoin('account.staff', 'staff')
      .where("account.role != :role", { role: Role.STUDENT })
      .andWhere(new Brackets(qb => {
        queryDto.status?.length && qb.andWhere('leaveRequest.status IN (:...status)', { status: queryDto.status });
        queryDto.search && qb.orWhere("account.lowerCasedFullName LIKE LOWER(:search)", { search: `${queryDto.search}%` });

        if (!!queryDto.employeeTypes?.length && !queryDto.employeeTypes.includes(Role.TEACHER)) {
          queryDto.employeeTypes?.length && qb.andWhere('staff.type IN (:...employeeTypes)', { employeeTypes: queryDto.employeeTypes });
        } else if (!!queryDto.employeeTypes?.length) {
          qb.andWhere(new Brackets(qb => {
            qb.orWhere('staff.type IN (:...employeeTypes)', { employeeTypes: queryDto.employeeTypes });
            qb.orWhere('teacher.id IS NOT NULL');
          }))
        }
      }));

    applySelectColumns(querybuilder, employeesLeaveRequestSelectCols, 'leaveRequest');
    this.utilitiesService.applyBranchFilter(querybuilder);

    return paginatedData(queryDto, querybuilder);
  }

  async getMyLeaveRequests() {
    const { accountId } = this.utilitiesService.getCurrentUser();

    return this.getRepository(LeaveRequest).find({
      where: {
        account: { id: accountId }
      },
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        title: true,
        leaveFrom: true,
        leaveTo: true,
        status: true,
        description: true,
        requestedOn: true,
      }
    });
  }

  async findOne(id: string) {
    const existing = await this.getRepository(LeaveRequest).findOne({
      where: { id },
      relations: {
        account: true,
      },
      select: {
        account: {
          id: true,
        }
      }
    });
    if (!existing) throw new NotFoundException('Leave request not found');

    return existing;
  }

  async updateStatus(id: string, updateLeaveRequestStatusDto: UpdateLeaveRequestStatusDto) {
    const existing = await this.findOne(id);

    if (existing.status !== ELeaveRequestStatus.PENDING) throw new BadRequestException('Cannot change the status now');

    existing.status = updateLeaveRequestStatusDto.status;
    await this.getRepository(LeaveRequest).save(existing);

    // update the attendance for leave
    if (updateLeaveRequestStatusDto.status === ELeaveRequestStatus.APPROVED) {
      this.eventEmitter.emit(AttendanceEvent.CREATE_LEAVE, new CreateLeaveAttendanceEvent({
        accountId: existing.account?.id,
        dateFrom: startOfDayString(existing.leaveFrom),
        dateTo: startOfDayString(existing.leaveTo),
      }));
    }

    return {
      message: 'Status updated',
    };
  }

  async update(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateLeaveRequestDto);
    await this.getRepository(LeaveRequest).save(existing);

    return {
      message: 'Updated successfully',
    };
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.getRepository(LeaveRequest).remove(existing);

    return {
      message: 'Removed successfully',
    }
  }
}
