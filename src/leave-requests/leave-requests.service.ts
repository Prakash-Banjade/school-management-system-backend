import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './dto/update-leave-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { Brackets, Repository } from 'typeorm';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { AuthUser, Role } from 'src/common/types/global.type';
import paginatedData from 'src/utils/paginatedData';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { isStudent } from 'src/utils/isStudent';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { employeesLeaveRequestSelectCols, leaveRequestSelectCols } from './helpers/leave-requests-select-cols.config';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest) private readonly leaveRequestRepo: Repository<LeaveRequest>,
    private readonly accountsService: AccountsService,
  ) { }

  async create(createLeaveRequestDto: CreateLeaveRequestDto, currentUser: AuthUser) {
    if (currentUser.role === Role.ADMIN && !createLeaveRequestDto.accountId) throw new BadRequestException('Account id is required');
    const accountId = currentUser.role === Role.ADMIN ? createLeaveRequestDto.accountId : currentUser.accountId;

    const account = await this.accountsService.findOne(accountId);

    const newLeaveRequest = this.leaveRequestRepo.create({
      ...createLeaveRequestDto,
      account
    });

    const savedLevaeRequest = await this.leaveRequestRepo.save(newLeaveRequest);
    return this.leaveRequestMutationReturn(savedLevaeRequest, 'created');
  }

  async findAll(queryDto: LeaveRequestQueryDto, currentUser: AuthUser) { // only for students leave request
    const querybuilder = this.leaveRequestRepo.createQueryBuilder('leaveRequest');

    querybuilder
      .orderBy('leaveRequest.createdAt', queryDto.order)
      .take(queryDto.take)
      .skip(queryDto.skip)
      .leftJoin('leaveRequest.account', 'account')
      .leftJoin('account.student', 'student')
      .leftJoin('student.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .andWhere(new Brackets(qb => {
        if (currentUser.role === Role.ADMIN) { // admin access
          queryDto.classRoomId && qb.andWhere(new Brackets(qb => {
            qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
            qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
          }));

          queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });
          queryDto.status?.length && qb.andWhere('leaveRequest.status IN (:...status)', { status: Array.isArray(queryDto.status) ? queryDto.status : [queryDto.status] });

          qb.andWhere('account.role = :role', { role: Role.STUDENT }); // only for students

        } else if (isStudent(currentUser)) {
          qb.andWhere('account.id = :accountId', { accountId: currentUser.accountId })
        }
      }));

    applySelectColumns(querybuilder, leaveRequestSelectCols, 'leaveRequest');

    return paginatedData(queryDto, querybuilder);
  }

  async getEmployeeLeaveRequests(queryDto: LeaveRequestQueryDto) {
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
        queryDto.search && qb.andWhere(new Brackets(qb => {
          qb.orWhere("LOWER(CONCAT(teacher.firstName, ' ', teacher.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
          qb.orWhere("LOWER(CONCAT(staff.firstName, ' ', staff.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
        }))

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

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.leaveRequestRepo.findOne({
      where: { id }
    });
    if (!existing) throw new NotFoundException('Leave request not found');

    return existing;
  }

  async updateStatus(id: string, updateLeaveRequestStatusDto: UpdateLeaveRequestStatusDto) {
    const existing = await this.findOne(id);

    existing.status = updateLeaveRequestStatusDto.status;
    await this.leaveRequestRepo.save(existing);

    return {
      message: 'Status updated',
    };
  }

  async update(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateLeaveRequestDto);
    const savedLeaveRequest = await this.leaveRequestRepo.save(existing);

    return this.leaveRequestMutationReturn(savedLeaveRequest, 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return this.leaveRequestMutationReturn(await this.leaveRequestRepo.remove(existing), 'deleted');
  }

  private leaveRequestMutationReturn = (leaveRequest: LeaveRequest, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Leave request created successfully' : 'Leave request updated successfully',
      leaveRequest: {
        id: leaveRequest.id,
        startDate: leaveRequest.leaveFrom,
        endDate: leaveRequest.leaveTo,
      }
    }
  }
}
