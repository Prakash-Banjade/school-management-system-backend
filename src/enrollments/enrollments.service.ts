import { ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
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
import { AcademicYearsService } from 'src/academic-years/academic-years.service';

@Injectable({ scope: Scope.REQUEST })
export class EnrollmentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly classRoomService: ClassRoomsService,
    private readonly academicYearService: AcademicYearsService,
  ) {
    super(dataSource, req);
  }

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { isPast, latestAcademicYear } = await this.academicYearService.isPast();
    if (isPast) throw new ConflictException('Promotion are only allowed from latest academic year');

    // check if any of the student is aready enrolled in the academic year or is not begin demoted
    await this.checkIfEnrollmentExists(latestAcademicYear, createEnrollmentDto.studentsWithRollNo.map(student => student.studentId),);

    const students = await this.getRepository<Student>(Student).createQueryBuilder('student')
      .whereInIds(createEnrollmentDto.studentsWithRollNo.map(student => student.studentId))
      .select([
        'student.id',
      ])
      .getMany();

    if (students.length !== createEnrollmentDto.studentsWithRollNo?.length) throw new NotFoundException('Student not found');

    const newClassRoom = await this.classRoomService.findOne(createEnrollmentDto.classRoomId);

    // create the enrollment
    const enrollments = this.getRepository<Enrollment>(Enrollment).create(students.map((student, ind) => ({
      student,
      classRoom: newClassRoom,
      academicYear: latestAcademicYear,
      enrollmentDate: createEnrollmentDto.enrollmentDate,
      registrationNumber: getRegistrationNumber(latestAcademicYear),
      rollNo: createEnrollmentDto.studentsWithRollNo[ind].newRollNo,
    })))

    await this.getRepository<Enrollment>(Enrollment).save(enrollments);

    // update student classroom
    const promotedStudents = students.map((student, ind) => {
      student.classRoom = newClassRoom;
      student.academicYearIds = [...(student.academicYearIds ?? []), latestAcademicYear.id];
      student.rollNo = createEnrollmentDto.studentsWithRollNo[ind].newRollNo;
      return student;
    });

    await this.getRepository<Student>(Student).save(promotedStudents);

    return {
      message: "Promotion Successful",
    }
  };

  private async checkIfEnrollmentExists(academicYear: AcademicYear, studentIds: string[],) {
    const existingEnrollment = await this.getRepository<Enrollment>(Enrollment).createQueryBuilder('enrollment')
      .where("enrollment.academicYearId = :academicYearId", { academicYearId: academicYear.id })
      .leftJoin('enrollment.student', 'student')
      .andWhere("student.id IN (:...studentIds)", { studentIds })
      .select(['enrollment.id', 'student.firstName', 'student.lastName'])
      .getOne();

    const studentName = `${existingEnrollment?.student?.firstName} ${existingEnrollment?.student?.lastName}`;

    if (existingEnrollment) throw new ConflictException(`Enrollment of ${studentName} already exists`);
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
