import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';
import { DataSource } from 'typeorm';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { Student } from 'src/students/entities/student.entity';
import { REQUEST } from '@nestjs/core';
import { enrollmentSelectColumns } from './entities/enrollments-select-cols.config';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import paginatedData from 'src/utils/paginatedData';
import { getRegistrationNumber } from 'src/utils/get-registration-number';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';

@Injectable({ scope: Scope.REQUEST })
export class EnrollmentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly classRoomService: ClassRoomsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(dataSource, req);
  }

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const currentAcademicYearId: string | undefined = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    // check if any of the student is aready enrolled in the academic year
    await this.checkIfEnrollmentExists(createEnrollmentDto.academicYearId, createEnrollmentDto.studentsWithRollNo.map(student => student.studentId));

    const newAcademicYear = await this.getRepository<AcademicYear>(AcademicYear).findOneBy({ id: createEnrollmentDto.academicYearId }); // enroll in current academic year
    if (!newAcademicYear) throw new NotFoundException('Academic year not found');

    if (currentAcademicYearId === newAcademicYear.id) throw new BadRequestException('Cannot enroll in current academic year');

    const students = await this.getRepository<Student>(Student).createQueryBuilder('student')
      .whereInIds(createEnrollmentDto.studentsWithRollNo.map(student => student.studentId))
      .andWhere('FIND_IN_SET(:currentAcademicYearId, student.academicYearIds)', { currentAcademicYearId }) // The FIND_IN_SET function in MySQL returns the position (index) of the specified item (tag) within the comma-separated list (tags).
      .select([
        'student.id',
        'student.academicYearIds',
      ])
      .getMany();

    if (students.length !== createEnrollmentDto.studentsWithRollNo?.length) throw new NotFoundException('Student not found');

    const newClassRoom = await this.classRoomService.findOne(createEnrollmentDto.classRoomId);

    // create the enrollment
    const enrollments = this.getRepository<Enrollment>(Enrollment).create(students.map((student, ind) => ({
      student,
      classRoom: newClassRoom,
      academicYear: newAcademicYear,
      enrollmentDate: createEnrollmentDto.enrollmentDate,
      registrationNumber: getRegistrationNumber(newAcademicYear),
      rollNo: createEnrollmentDto.studentsWithRollNo[ind].newRollNo,
    })))

    await this.getRepository<Enrollment>(Enrollment).save(enrollments);

    // update student classroom
    const promotedStudents = students.map((student, ind) => {
      student.classRoom = newClassRoom;
      student.academicYearIds = [...(student.academicYearIds ?? []), newAcademicYear.id];
      student.rollNo = createEnrollmentDto.studentsWithRollNo[ind].newRollNo;
      return student;
    });

    await this.getRepository<Student>(Student).save(promotedStudents);

    return {
      message: "Promotion Successful",
    }
  };

  private async checkIfEnrollmentExists(academicYearId: string, studentIds: string[]) {
    const existingEnrollment = await this.getRepository<Enrollment>(Enrollment).createQueryBuilder('enrollment')
      .where("enrollment.academicYearId = :academicYearId", { academicYearId })
      .andWhereInIds(studentIds)
      .getOne();

    if (existingEnrollment) throw new ConflictException('Enrollment already exists');
  }

  async findAll(queryDto: EnrollmentQueryDto) {
    const queryBuilder = this.getRepository<Enrollment>(Enrollment).createQueryBuilder('enrollment');

    queryBuilder
      .orderBy('enrollment.createdAt', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('enrollment.student', 'student')
      .leftJoin('enrollment.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('enrollment.academicYear', 'academicYear')

    applySelectColumns(queryBuilder, enrollmentSelectColumns, 'enrollment');

    return paginatedData(queryDto, queryBuilder);
  }
}
