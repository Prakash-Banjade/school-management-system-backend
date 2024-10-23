import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Brackets, Repository } from 'typeorm';
import { AttendaceQueryDto } from './dto/attendance-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { AuthUser, Role } from 'src/common/types/global.type';
import { isStudent } from 'src/utils/isStudent';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { attendanceSelectCols } from './helpers/attendance-select-cols.config';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    private readonly accountsService: AccountsService,
  ) { }

  async create(createAttendanceDto: CreateAttendanceDto) {
    const account = await this.accountsService.findOne(createAttendanceDto.accountId);

    const attendance = this.attendanceRepo.create({
      ...createAttendanceDto,
      account
    });

    const savedAttendance = await this.attendanceRepo.save(attendance);

    return {
      message: 'Attendance created successfully',
      attendance: {
        id: savedAttendance.id,
        account: savedAttendance.account.firstName + ' ' + savedAttendance.account.lastName
      }
    }
  }

  async findAll(queryDto: AttendaceQueryDto, currentUser: AuthUser) {
    const queryBuilder = this.attendanceRepo.createQueryBuilder('attendance');

    queryBuilder
      .orderBy("attendance.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin("attendance.account", "account")
      .leftJoin("account.student", "student")
      .leftJoin("student.classRoom", "classRoom")
      .andWhere(new Brackets(qb => {
        queryDto.status && qb.andWhere('attendance.status = :status', { status: queryDto.status })
        queryDto.month && qb.andWhere('MONTH(attendance.date) = :month', { month: queryDto.month });

        if (currentUser.role === Role.ADMIN) { // admin access
          queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId', { classRoomId: `%${queryDto.classRoomId}%` })
          queryDto.studentId && qb.andWhere('student.id = :studentId', { studentId: `%${queryDto.studentId}%` })
          queryDto.search && qb.andWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
        } else if (isStudent(currentUser)) { // student access
          qb.andWhere('account.id = :accountId', { accountId: currentUser.accountId })
        }
      }));

    applySelectColumns(queryBuilder, attendanceSelectCols, 'attendance');

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.attendanceRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException('Attendance not found');

    return existing;
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    const { status, outTime } = updateAttendanceDto;
    if (!status && !outTime) throw new BadRequestException('Status or outTime required');

    const existing = await this.findOne(id);

    updateAttendanceDto.status && (existing.status = status);
    updateAttendanceDto.outTime && (existing.outTime = outTime);

    const savedAttendance = await this.attendanceRepo.save(existing);

    return {
      message: 'Attendance updated successfully',
      attendance: {
        id: savedAttendance.id,
        account: savedAttendance.account.firstName + ' ' + savedAttendance.account.lastName,
      }
    }
  }

  async remove(id: string) {
    return `This action removes a #${id} attendance`;
  }
}
