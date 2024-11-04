import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';
import { DataSource, In } from 'typeorm';
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

    const newAcademicYear = await this.getRepository<AcademicYear>(AcademicYear).findOneBy({ id: createEnrollmentDto.academicYearId }); // enroll in current academic year
    if (!newAcademicYear) throw new NotFoundException('Academic year not found');

    if (currentAcademicYearId === newAcademicYear.id) throw new BadRequestException('Cannot enroll in current academic year');

    console.log({
      currentAcademicYearId,
      studentIds: createEnrollmentDto.studentsWithRollNo.map(student => student.studentId)
    })

    const students = await this.getRepository<Student>(Student).find({
      where: {
        id: In(createEnrollmentDto.studentsWithRollNo.map(student => student.studentId)),
        currentAcademicYear: { id: currentAcademicYearId }
      },
    });

    if (!students?.length) throw new NotFoundException('Student not found');

    const newClassRoom = await this.classRoomService.findOne(createEnrollmentDto.classRoomId);

    // create the enrollment
    const enrollments = this.getRepository<Enrollment>(Enrollment).create(students.map(student => ({
      student,
      classRoom: newClassRoom,
      academicYear: newAcademicYear,
      enrollmentDate: createEnrollmentDto.enrollmentDate,
      registrationNumber: getRegistrationNumber(newAcademicYear),
    })))

    await this.getRepository<Enrollment>(Enrollment).save(enrollments);

    // update student classroom
    const promotedStudents = students.map(student => {
      student.classRoom = newClassRoom;
      student.currentAcademicYear = newAcademicYear;
      return student;
    });

    await this.getRepository<Student>(Student).save(promotedStudents);

    return {
      message: "Promotion Successful",
    }
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
