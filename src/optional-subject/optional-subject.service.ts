import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
import { InjectDataSource } from '@nestjs/typeorm';

type OptionalSubjectQuery = {
  optionalSubjectId: string,
  classRoomId: string,
  studentIds: string | string[] | null,
  studentIdsOtherAcademicYear: string | string[] | null;
}

@Injectable()
export class OptionalSubjectService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDataSource() private readonly typeORMDataSource: DataSource,
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
        .addSelect(`JSON_ARRAYAGG(CASE WHEN enrollments.academicYearId = '${latestAcademicYear.id}' THEN students.id END) as studentIds`)
        .addSelect(`JSON_ARRAYAGG(CASE WHEN enrollments.academicYearId != '${currentAcademicYearId}' THEN students.id END) as studentIdsOtherAcademicYear`)
        .groupBy('enrollments.academicYearId')
        .getRawOne();

      if (!optionalSubject || !optionalSubject.classRoomId) throw new NotFoundException('Optional subject not found');

      console.log(optionalSubject.studentIds, optionalSubject.studentIdsOtherAcademicYear)

      const subjectStudentIds = (typeof optionalSubject.studentIds === 'string'
        ? JSON.parse(optionalSubject.studentIds) as string[]
        : optionalSubject.studentIds === null ? [] : optionalSubject.studentIds).filter(Boolean);

      // // update optional subject students
      // const relationMetadata = this.getRepository(OptionalSubject).metadata.relations.find(r => r.inverseEntityMetadata.target === Student);
      // if (!relationMetadata) throw new InternalServerErrorException('Relation with Student not found on Optional subject entity.');

      // const joinTableName = relationMetadata.joinTableName;
      // if (!joinTableName) throw new InternalServerErrorException('Join table name not found on Optional subject entity.');

      // await this.typeORMDataSource
      //   .createQueryBuilder()
      //   .insert()
      //   .into(joinTableName)
      //   .values(
      //     updatedStudentIds.map(studentId => ({
      //       [relationMetadata.joinColumns[0].databaseName]: optionalSubject.optionalSubjectId,
      //       [relationMetadata.inverseJoinColumns[0].databaseName]: studentId,
      //     }))
      //   )
      //   .orIgnore() // Avoid duplicates
      //   .execute();

      console.log(studentIds, subjectStudentIds)

      const result = await this.getRepository(OptionalSubject).createQueryBuilder()
        .relation(OptionalSubject, 'students')
        .of(optionalSubject.optionalSubjectId) // ID of the new parent
        .addAndRemove(studentIds, subjectStudentIds)



    }


  }

  async findAll(queryDto: OptionalSubjectQueryDto) {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    const queryBuilder = this.getRepository(OptionalSubject).createQueryBuilder('optionalSubject')
      .leftJoin('optionalSubject.students', 'students')
      .leftJoin(
        'students.enrollments',
        'enrollments',
        'enrollments.academicYearId = :academicYearId',
        { academicYearId: currentAcademicYearId }
      )
      .leftJoin('optionalSubject.subject', 'subject')
      .where('optionalSubject.classRoomId = :classRoomId', { classRoomId: queryDto.classRoomId })
      .select([
        'optionalSubject.id as id',
        'subject.id as subjectId',
        'subject.subjectName as subjectName',
        `JSON_ARRAYAGG(CASE WHEN enrollments.academicYearId = '${currentAcademicYearId}' THEN students.id ELSE NULL END) as studentIds`,
      ])
      .groupBy('optionalSubject.id')
      .addGroupBy('subject.id');

    const data = await queryBuilder.getRawMany();

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
}
