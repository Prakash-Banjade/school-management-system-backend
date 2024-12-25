import { BadRequestException, Inject, Injectable, InternalServerErrorException, Scope } from '@nestjs/common';
import { AssignOptionalSubjectDto } from './dto/create-optional-subject.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { OptionalSubject } from './entities/optional-subject.entity';
import { OptionalSubjectQueryDto } from './dto/optional-subject-query.dto';
import { Student } from 'src/students/entities/student.entity';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable({ scope: Scope.REQUEST })
export class OptionalSubjectService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly academicYearsService: AcademicYearsService,
    private readonly utilitiesService: UtilitiesService
  ) { super(datasource, req) }

  async assignSubjects(dto: AssignOptionalSubjectDto) {
    const { isPast } = await this.academicYearsService.isPast();
    if (isPast) throw new BadRequestException('Cannot assign optional subjects after the current academic year has ended');

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
    const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();

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
