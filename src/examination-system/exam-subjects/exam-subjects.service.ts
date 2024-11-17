import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { UpdateExamSubjectDto } from './dto/update-exam-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamSubject } from './entities/exam-subject.entity';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { ExamSubjectQueryDto } from './dto/exam-subject-query.dto';
import { paginatedRawData } from 'src/utils/paginatedData';
import { examSubjectOptionsSelectCols, examSubjectSelectCols } from './helpers/exam-subject-select-cols';
import { Cache } from 'cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class ExamSubjectsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    @InjectRepository(ExamSubject) private examSubjectRepo: Repository<ExamSubject>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { super(dataSource, req); }

  async findAll(queryDto: ExamSubjectQueryDto) {
    const querybuilder = this.examSubjectRepo.createQueryBuilder('examSubject');
    const currentAcademicYearId: string = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    querybuilder
      .orderBy("examSubject.examDate", queryDto.order)
      .offset((queryDto.asOptions || queryDto.skipPagination) ? undefined : queryDto.skip)
      .limit((queryDto.asOptions || queryDto.skipPagination) ? undefined : queryDto.take)
      .leftJoin('examSubject.exam', 'exam')
      .where("exam.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
      .leftJoin('exam.classRoom', 'classRoom')
      .leftJoin('classRoom.children', 'children')
      .leftJoin('exam.examType', 'examType')
      .leftJoin('examSubject.subject', 'subject')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere('LOWER(subject.subjectName) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
        queryDto.examId && qb.andWhere("exam.id = :examId", { examId: queryDto.examId })
        queryDto.onlyPast && qb.andWhere("DATE(exam.examDate) < CURRENT_DATE()")
        queryDto.examTypeId && qb.andWhere('examType.id = :examTypeId', { examTypeId: queryDto.examTypeId })
        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR children.id = :classRoomId', { classRoomId: queryDto.classRoomId }) // this is done because student can be in section and the exam is in primary class, so look in children; this is done when student queries the exam-subjects
      }))
      .groupBy('examSubject.id')
      .select(queryDto.asOptions ? examSubjectOptionsSelectCols : examSubjectSelectCols);

    if (queryDto.asOptions) {
      return querybuilder.getRawMany();
    }

    return paginatedRawData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const currentAcademicYearId: string = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    const existing = await this.examSubjectRepo.findOne({
      where: {
        id,
        exam: {
          academicYear: { id: currentAcademicYearId } // fetch for only current academic year
        }
      },
      relations: {
        exam: true,
        subject: true
      }
    })
    if (!existing) throw new NotFoundException('Exam subject not found')

    return existing;
  }

  async update(id: string, updateExamSubjectDto: UpdateExamSubjectDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateExamSubjectDto);
    await this.examSubjectRepo.save(existing);

    return {
      message: 'Exam subject updated',
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.examSubjectRepo.remove(existing);

    return {
      message: 'Exam subject deleted',
    }
  }
}
