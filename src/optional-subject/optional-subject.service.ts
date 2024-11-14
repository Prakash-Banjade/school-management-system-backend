import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class OptionalSubjectService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { super(datasource, req) }

  async assignSubjects(dto: AssignOptionalSubjectDto) {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);
    const { selections } = dto;

    for (const selection of selections) {
      const { studentIds, subjectId } = selection;

      const optionalSubject = await this.getRepository(OptionalSubject).createQueryBuilder('optionalSubject')
        .leftJoin('optionalSubject.subject', 'subject')
        .leftJoin('optionalSubject.classRoom', 'classRoom')
        .leftJoin('optionalSubject.students', 'students')
        .where("subject.id = :subjectId", { subjectId })
        .select(['optionalSubject.id', 'classRoom.id', 'students.id']) // the classRoom here is `primary` class
        .getOne();

      if (!optionalSubject || !optionalSubject.classRoom) throw new NotFoundException('Optional subject not found');

      const uniqueStudentIds = Array.from([...new Set(optionalSubject.students?.map(student => student.id)), ...studentIds]); // ensuring no duplicate students

      const students = await this.getRepository(Student).createQueryBuilder('student')
        .leftJoin('student.enrollments', 'enrollments', 'enrollments.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
        .leftJoin('enrollments.classRoom', 'classRoom')
        .leftJoin('classRoom.parent', 'parent')
        .where("CASE WHEN parent.id IS NULL THEN classRoom.id ELSE parent.id END = :classRoomId", { classRoomId: optionalSubject.classRoom?.id })
        .andWhereInIds(uniqueStudentIds)
        .select(['student.id'])
        .getMany();

      if (students.length === 0) throw new NotFoundException('No students found');

      console.log(students)

      // update optional subject students

      optionalSubject.students = students;

      await this.getRepository(OptionalSubject).save(optionalSubject);
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
        `JSON_ARRAYAGG(students.id) as studentIds`,
      ])
      .groupBy("optionalSubject.id");

    const data = await querybuilder.getRawMany();

    const dataWithNoNullStudentIds = data.map(optionalSubject => {
      const studentIds: string[] = (typeof optionalSubject.studentIds === 'string' ? JSON.parse(optionalSubject.studentIds) : optionalSubject.studentIds).filter(Boolean);

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
