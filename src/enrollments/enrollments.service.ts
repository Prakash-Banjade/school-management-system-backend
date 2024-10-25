import { ConflictException, Inject, Injectable, Scope } from '@nestjs/common';
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

@Injectable({ scope: Scope.REQUEST })
export class EnrollmentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly classRoomService: ClassRoomsService,
  ) {
    super(dataSource, req);
  }

  async create(createEnrollmentDto: CreateEnrollmentDto, newStudent: boolean = false) {
    const student = await this.getRepository<Student>(Student).findOneBy({ id: createEnrollmentDto.studentId });
    const classRoom = await this.classRoomService.findOne(createEnrollmentDto.classRoomId);
    const academicYear = await this.getRepository<AcademicYear>(AcademicYear).findOneBy({ isActive: true }); // enroll in current academic year

    const registrationNumber = getRegistrationNumber(academicYear);

    const existingEnrollment = await this.getRepository<Enrollment>(Enrollment).findOne({
      where: {
        student: { id: student.id },
        classRoom: { id: classRoom.id },
        academicYear: { id: academicYear.id },
        registrationNumber,
      }
    });
    if (existingEnrollment) throw new ConflictException('Enrollment with same student, class room and academic year already exists');

    // create the enrollment
    const enrollment = this.getRepository<Enrollment>(Enrollment).create({ student, classRoom, academicYear, enrollmentDate: createEnrollmentDto.enrollmentDate });
    const savedEnrollment = await this.getRepository<Enrollment>(Enrollment).save(enrollment);

    // update student classroom
    if (!newStudent) {
      student.classRoom = classRoom;
      await this.getRepository<Student>(Student).save(student);
    }

    return this.enrollmentMutationReturn(savedEnrollment, 'created');
  }

  async findAll(queryDto: EnrollmentQueryDto) {
    const queryBuilder = this.getRepository<Enrollment>(Enrollment).createQueryBuilder('enrollment');

    queryBuilder
      .orderBy('enrollment.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('enrollment.student', 'student')
      .leftJoin('enrollment.classRoom', 'classRoom')
      .leftJoin('enrollment.academicYear', 'academicYear')

    applySelectColumns(queryBuilder, enrollmentSelectColumns, 'enrollment');

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingEnrollment = await this.getRepository<Enrollment>(Enrollment).findOne({
      where: { id },
      relations: {
        student: true,
        classRoom: true,
        academicYear: true
      },
      select: enrollmentSelectColumns,
    });

    if (!existingEnrollment) throw new ConflictException('Enrollment not found');

    return existingEnrollment;
  }

  // async update(id: number, updateEnrollmentDto: UpdateEnrollmentDto) {
  //   return `This action updates a #${id} enrollment`;
  // }

  // async remove(id: number) {
  //   return `This action removes a #${id} enrollment`;
  // }

  private enrollmentMutationReturn = (enrollment: Enrollment, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Enrollment created successfully' : type === 'deleted' ? 'Enrollment deleted successfully' : 'Enrollment updated successfully',
      enrollment: {
        id: enrollment.id,
        student: enrollment.student.firstName + ' ' + enrollment.student.lastName,
        classRoom: enrollment.classRoom.name,
        academicYear: enrollment.academicYear.name,
      }
    }
  }
}
