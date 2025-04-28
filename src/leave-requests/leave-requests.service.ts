import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './dto/update-leave-request.dto';
import { LeaveRequest } from './entities/leave-request.entity';
import { Brackets, Repository } from 'typeorm';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { AuthUser, ELeaveRequestStatus, Role } from 'src/common/types/global.type';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { employeesLeaveRequestSelectCols, leaveRequestSelectCols } from './helpers/leave-requests-select-cols.config';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceEvent } from 'src/attendances/helpers/attendances.helper';
import { CreateLeaveAttendanceEvent } from 'src/attendances/dto/create-attendance.dto';
import { isTeacher, startOfDayString } from 'src/utils/utils';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest) private readonly leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(Account) private readonly accountsRepo: Repository<Account>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(createLeaveRequestDto: CreateLeaveRequestDto, currentUser: AuthUser) {
    const account = await this.getAccount(currentUser.accountId);

    const newLeaveRequest = this.leaveRequestRepo.create({
      ...createLeaveRequestDto,
      account
    });

    await this.leaveRequestRepo.save(newLeaveRequest);

    return {
      message: 'Leave request applied successfully. You will be notified once it has been approved.',
    }
  }

  private async getAccount(accountId: string) {
    const account = await this.accountsRepo.findOne({
      where: { id: accountId },
      select: { id: true }
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async findAll(queryDto: LeaveRequestQueryDto, currentUser: AuthUser, branchId: string) { // only for students leave request
    const querybuilder = this.leaveRequestRepo.createQueryBuilder('leaveRequest');

    querybuilder
      .orderBy('leaveRequest.createdAt', queryDto.order)
      .take(queryDto.take)
      .skip(queryDto.skip)
      .leftJoin('leaveRequest.account', 'account')
      .leftJoin('account.student', 'student')
      .leftJoin('student.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('classRoom.faculty', 'faculty')
      .where('account.role = :role', { role: Role.STUDENT })
      .andWhere(new Brackets(qb => {
        queryDto.classRoomId && qb.andWhere("parent.id = :classRoomId OR classRoom.id = :classRoomId", { classRoomId: queryDto.classRoomId })
        queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });
        queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });
        queryDto.status?.length && qb.andWhere('leaveRequest.status IN (:...status)', { status: Array.isArray(queryDto.status) ? queryDto.status : [queryDto.status] });
      }));

    if (isTeacher(currentUser)) {
      querybuilder.andWhere("classRoom.classTeacherId = :teacherId", { teacherId: currentUser.teacherId })
    }

    if (branchId) querybuilder.andWhere('classRoom.branchId = :branchId', { branchId });

    applySelectColumns(querybuilder, leaveRequestSelectCols, 'leaveRequest');

    return paginatedData(queryDto, querybuilder);
  }

  async getEmployeeLeaveRequests(queryDto: LeaveRequestQueryDto, branchId: string) {
    const querybuilder = this.leaveRequestRepo.createQueryBuilder('leaveRequest');

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

    if (branchId) querybuilder.andWhere('classRoom.branchId = :branchId', { branchId });

    return paginatedData(queryDto, querybuilder);
  }

  async getMyLeaveRequests(currentUser: AuthUser) {
    return this.leaveRequestRepo.find({
      where: {
        account: { id: currentUser.accountId }
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

  async findOne(id: string, currentUser: AuthUser) {
    const querybuilder = this.leaveRequestRepo.createQueryBuilder('leaveRequest')
      .where({ id })
      .leftJoin("leaveRequest.account", "account")
      .select([
        "leaveRequest.id",
        "leaveRequest.createdAt",
        "leaveRequest.leaveFrom",
        "leaveRequest.leaveTo",
        "leaveRequest.title",
        "leaveRequest.description",
        "leaveRequest.requestedOn",
        "leaveRequest.status",
        "account.id"
      ]);

    if (isTeacher(currentUser)) { // teacher can request leave request of student of his assigned classes only
      querybuilder
        .andWhere("account.role = :role", { role: Role.STUDENT })
        .leftJoin("account.student", "student")
        .innerJoin("student.classRoom", "classRoom", "classRoom.classTeacherId = :teacherId", { teacherId: currentUser.teacherId })
    }

    const leaveRequest = await querybuilder.getOne();

    if (!leaveRequest) throw new NotFoundException('Leave request not found');

    return leaveRequest;
  }

  async updateStatus(id: string, updateLeaveRequestStatusDto: UpdateLeaveRequestStatusDto, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);

    if (existing.status !== ELeaveRequestStatus.PENDING) throw new BadRequestException('Cannot change the status now');

    existing.status = updateLeaveRequestStatusDto.status;
    await this.leaveRequestRepo.save(existing);

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

  async update(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);

    Object.assign(existing, updateLeaveRequestDto);
    await this.leaveRequestRepo.save(existing);

    return {
      message: 'Updated successfully',
    };
  }

  async remove(id: string, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);
    await this.leaveRequestRepo.remove(existing);

    return {
      message: 'Removed successfully',
    }
  }
}
