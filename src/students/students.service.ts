import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';
import { Brackets, DataSource, IsNull, Not, Or } from 'typeorm';
import { StudentQueryDto, StudentSortBy } from './dto/student-query.dto';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { GuardiansService } from 'src/guardians/guardians.service';
import { REQUEST } from '@nestjs/core';
import { studentsColumnsConfig } from './entities/studentsColumnsConfig';
import { DormitoryRoomsService } from 'src/dormitory-system/dormitory-rooms/dormitory-rooms.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { FastifyRequest } from 'fastify';
import { Deleted } from 'src/common/dto/query.dto';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import paginatedData from 'src/utils/paginatedData';

@Injectable({ scope: Scope.REQUEST })
export class StudentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly classRoomsService: ClassRoomsService,
    private readonly guardiansService: GuardiansService,
    private readonly accountsService: AccountsService,
    private dormitoryRoomsService: DormitoryRoomsService,
    private readonly enrollmentsService: EnrollmentsService
  ) {
    super(dataSource, req);
  }

  async create(createStudentDto: CreateStudentDto) {
    // check if student already exists
    await this.checkIfStudentExists(createStudentDto);

    // evaluate profile image
    const profileImage = createStudentDto.profileImageId
      ? await this.imageService.findOne(createStudentDto.profileImageId)
      : null;

    // evaluate class room
    const classRoom = await this.classRoomsService.findOne(createStudentDto.classRoomId);

    // evaluate document attatchments
    const documentAttatchments = createStudentDto.documentAttatchmentIds
      ? await this.imageService.findAllByIds(createStudentDto.documentAttatchmentIds)
      : null;

    // evaluate dormitory room
    const dormitoryRoom = createStudentDto.dormitoryRoomId
      ? await this.dormitoryRoomsService.findOne(createStudentDto.dormitoryRoomId)
      : null;

    const newStudent = this.getRepository<Student>(Student).create({
      ...createStudentDto,
      profileImage,
      classRoom,
      documentAttatchments,
      dormitoryRoom
    });

    const savedStudent = await this.getRepository<Student>(Student).save(newStudent);

    // CREATE ACCOUNT
    await this.accountsService.createAccount(savedStudent);

    // CREATE GUARDIANS
    await this.guardiansService.createGuardiansByStudent(createStudentDto.guardians, savedStudent);

    // CREATE ENROLLMENTS
    await this.enrollmentsService.create({
      studentId: savedStudent.id,
      classRoomId: classRoom.id,
      enrollmentDate: createStudentDto.admissionDate,
    }, true);

    return this.studentMutationReturn(savedStudent, 'created');
  }

  async findAll(queryDto: StudentQueryDto) {
    const queryBuilder = this.getRepository<Student>(Student).createQueryBuilder('student');
    const deletedAt = queryDto.deleted === Deleted.ONLY ? Not(IsNull()) : queryDto.deleted === Deleted.NONE ? IsNull() : Or(IsNull(), Not(IsNull()));

    queryBuilder
      .orderBy(this.getOrderByKey(queryDto), queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .withDeleted()
      .where({ deletedAt })
      .leftJoin('student.classRoom', 'classRoom')
      .leftJoin('student.account', 'account')
      .leftJoin('student.enrollments', 'enrollment')
      .leftJoin('enrollment.academicYear', 'academicYear')
      .leftJoin('account.user', 'user')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('student.guardians', 'guardians')
      .andWhere(new Brackets(qb => {
        // filter by active academic year
        queryDto.academicYearId
          ? qb.where('academicYear.id = :academicYearId', { academicYearId: queryDto.academicYearId })
          : qb.where('academicYear.isActive = :isActive', { isActive: true })

        queryDto.search && qb.andWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    applySelectColumns(queryBuilder, studentsColumnsConfig, 'student');

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository<Student>(Student).findOne({
      where: { id },
      relations: {
        classRoom: true,
        profileImage: true,
      }
    })
    if (!existing) throw new NotFoundException('Student not found')

    return existing
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const existing = await this.findOne(id)

    // check if credentials are already taken
    await this.checkIfStudentExists(updateStudentDto, existing);

    // evaluate profile image
    const profileImage = updateStudentDto.profileImageId
      ? await this.imageService.findOne(updateStudentDto.profileImageId)
      : existing.profileImage;

    /**
    |--------------------------------------------------
    | don't allow to udpate class room
    |--------------------------------------------------
    */

    // evaluate document attatchments
    const documentAttatchments = updateStudentDto.documentAttatchmentIds
      ? await this.imageService.findAllByIds(updateStudentDto.documentAttatchmentIds)
      : existing.documentAttatchments;

    // evaluate dormitory room
    const dormitoryRoom = updateStudentDto.dormitoryRoomId
      ? await this.dormitoryRoomsService.findOne(updateStudentDto.dormitoryRoomId)
      : null;

    Object.assign(existing, {
      ...updateStudentDto,
      profileImage,
      documentAttatchments,
      dormitoryRoom,
    });

    const savedStudent = await this.getRepository<Student>(Student).save(existing);

    return this.studentMutationReturn(savedStudent, 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id)

    return this.getRepository<Student>(Student).remove(existing)
  }

  async checkIfStudentExists(studentDto: CreateStudentDto | UpdateStudentDto, student?: Student) {
    const { rollNo, admissionNumber, email, phone, bankAccountNumber, nationalIdCardNo } = studentDto;

    const existingStudent = await this.getRepository<Student>(Student).createQueryBuilder('student')
      .where(new Brackets(qb => {
        qb.where([
          { email },
          { phone },
          { rollNo },
          { admissionNumber },
          { bankAccountNumber }
        ])
        student?.id && qb.andWhere({ id: Not(student.id) })
      })).getOne();

    if (existingStudent && !student) {
      if (existingStudent.email === email) throw new BadRequestException('Student with this email already exists');
      if (existingStudent.nationalIdCardNo === nationalIdCardNo) throw new BadRequestException('Student with this nationalIdCardNo already exists');
      if (existingStudent.phone === phone) throw new BadRequestException('Student with this phone already exists');
      if (existingStudent.rollNo === rollNo) throw new BadRequestException('Student with this rollNo already exists');
      if (existingStudent.admissionNumber === admissionNumber) throw new BadRequestException('Student with this admissionNumber already exists');
      if (existingStudent.bankAccountNumber === bankAccountNumber) throw new BadRequestException('Student with this bankAccountNumber already exists');
    } else if (existingStudent && student) {
      if (existingStudent.email === email && existingStudent.id !== student.id) throw new BadRequestException('Student with this email already exists');
      if (existingStudent.nationalIdCardNo === nationalIdCardNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this nationalIdCardNo already exists');
      if (existingStudent.phone === phone && existingStudent.id !== student.id) throw new BadRequestException('Student with this phone already exists');
      if (existingStudent.rollNo === rollNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this rollNo already exists');
      if (existingStudent.admissionNumber === admissionNumber && existingStudent.id !== student.id) throw new BadRequestException('Student with this admissionNumber already exists');
      if (existingStudent.bankAccountNumber === bankAccountNumber && existingStudent.id !== student.id) throw new BadRequestException('Student with this bankAccountNumber already exists');
    }
  }

  private studentMutationReturn = (student: Student, type: 'created' | 'updated') => {
    return {
      message: type === 'created' ? 'Student created successfully' : 'Student updated successfully',
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
      }
    }
  }

  private getOrderByKey(queryDto: StudentQueryDto) {
    switch (queryDto.sortBy) {
      case StudentSortBy.NAME: {
        return 'CONCAT(student.firstName, " ", student.lastName)';
      }
      case StudentSortBy.ROLL_NO: {
        return 'student.rollNo';
      }
      case StudentSortBy.CLASS_ROOM: {
        return 'classRoom.parentClass.name';
      }
      case StudentSortBy.SUB_CLASS: {
        return 'classRoom.name';
      }
      case StudentSortBy.GENDER: {
        return 'student.gender';
      }
      default: {
        return 'student.createdAt';
      }
    }
  }
}
