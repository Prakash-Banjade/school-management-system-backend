import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AssignOptionalSubjectDto } from './dto/create-optional-subject.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { OptionalSubject } from './entities/optional-subject.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { OptionalSubjectQueryDto } from './dto/optional-subject-query.dto';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { Student } from 'src/students/entities/student.entity';

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

    const relationName = this.getRepository(OptionalSubject).metadata.relations.find(
      (relation) => relation.inverseEntityMetadata.target === Student,
    )?.propertyName;
    if (!relationName) throw new InternalServerErrorException('Unable to find the relation.');

    const { selections } = dto;

    for (const selection of selections) {
      const { optionalSubjectId, studentIds } = selection;

      const studentIdsToRemove = studentIds.filter(s => !s.isChecked).map(s => s.id);
      const studentIdsToAdd = studentIds.filter(s => s.isChecked).map(s => s.id);

      await this.getRepository(OptionalSubject)
        .createQueryBuilder()
        .relation(relationName)
        .of(optionalSubjectId)
        .addAndRemove(studentIdsToAdd, studentIdsToRemove);
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
