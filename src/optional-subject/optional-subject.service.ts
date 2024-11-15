import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AssignOptionalSubjectDto } from './dto/create-optional-subject.dto';
import { UpdateOptionalSubjectDto } from './dto/update-optional-subject.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { OptionalSubject } from './entities/optional-subject.entity';
import { Student } from 'src/students/entities/student.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { OptionalSubjectQueryDto } from './dto/optional-subject-query.dto';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';

type OptionalSubjectQuery = {
  optionalSubjectId: string,
  classRoomId: string,
  studentIds: string[] | null,
  studentIdsOtherAcademicYear: string[] | null
}

@Injectable()
export class OptionalSubjectService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { super(datasource, req) }

  async assignSubjects(dto: AssignOptionalSubjectDto) {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID); // this is one that is currently active
    const latestAcademicYear = await this.getRepository(AcademicYear).createQueryBuilder('academicYear') // this is one which is last added
      .orderBy('academicYear.startDate', 'DESC')
      .limit(1)
      .getOne();

    if (!latestAcademicYear) throw new NotFoundException('Latest academic year not found');
    if (currentAcademicYearId !== latestAcademicYear.id) throw new BadRequestException('Cannot modify optional subject of past students');

    const { selections } = dto;

    for (const selection of selections) {
      const { studentIds, subjectId } = selection;

      const optionalSubject: OptionalSubjectQuery = await this.getRepository(OptionalSubject).createQueryBuilder('optionalSubject')
        .leftJoin('optionalSubject.subject', 'subject')
        .leftJoin('optionalSubject.classRoom', 'classRoom')
        .leftJoin('optionalSubject.students', 'students')
        .leftJoin('students.enrollments', 'enrollments')
        .where("subject.id = :subjectId", { subjectId })
        .select([
          'optionalSubject.id as optionalSubjectId',
          'classRoom.id as classRoomId',
        ])
        .addSelect(`CASE WHEN enrollments.academicYearId = '${currentAcademicYearId}' THEN JSON_ARRAYAGG(students.id) END as studentIds`)
        .addSelect(`CASE WHEN enrollments.academicYearId != '${currentAcademicYearId}' THEN JSON_ARRAYAGG(students.id) END as studentIdsOtherAcademicYear`)
        .groupBy('enrollments.academicYearId')
        .getRawOne();

      console.log(optionalSubject)

      if (!optionalSubject || !optionalSubject.classRoomId) throw new NotFoundException('Optional subject not found');

      const updatedStudentIds = Array.from(new Set(studentIds)); // ensuring no duplicate students
      const pastStudentIds = Array.from(new Set(optionalSubject.studentIdsOtherAcademicYear ?? [])); // ensuring no duplicate students

      // update optional subject students

      await this.getRepository(OptionalSubject).createQueryBuilder()
        .relation(OptionalSubject, 'students')
        .of(optionalSubject.optionalSubjectId) // ID of the new parent
        .set([...pastStudentIds, ...updatedStudentIds])
    }


  }

  async findAll(queryDto: OptionalSubjectQueryDto) {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    const querybuilder = this.getRepository(OptionalSubject).createQueryBuilder('optionalSubject')
      .leftJoin('optionalSubject.students', 'students')
      .leftJoin('students.enrollments', 'enrollments', 'enrollments.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
      .leftJoin('optionalSubject.subject', 'subject')
      .where("optionalSubject.classRoomId = :classRoomId", { classRoomId: queryDto.classRoomId })
      .select([
        "optionalSubject.id as id",
        "subject.id as subjectId",
        "subject.subjectName as subjectName",
        `CASE WHEN enrollments.academicYearId = '${currentAcademicYearId}' THEN JSON_ARRAYAGG(students.id) END as studentIds`,
      ])
      .groupBy("optionalSubject.id")
      .addGroupBy("enrollments.academicYearId")

    const data = await querybuilder.getRawMany();

    const dataWithNoNullStudentIds = data.map(optionalSubject => {
      const studentIds: string[] = (
        typeof optionalSubject.studentIds === 'string'
          ? JSON.parse(optionalSubject.studentIds)
          : optionalSubject.studentIds === null // can be null when no students has been assigned to the optinoal subject
            ? [] : optionalSubject.studentIds
      ).filter(Boolean);

      return {
        ...optionalSubject,
        studentIds,
      }
    });

    return dataWithNoNullStudentIds;
  }

  findOne(id: number) {
    return `This action returns a #${id} optionalSubject`;
  }

  update(id: number, updateOptionalSubjectDto: UpdateOptionalSubjectDto) {
    return `This action updates a #${id} optionalSubject`;
  }

  remove(id: number) {
    return `This action removes a #${id} optionalSubject`;
  }
}
