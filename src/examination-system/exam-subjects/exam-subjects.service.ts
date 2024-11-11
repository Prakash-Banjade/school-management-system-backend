import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamSubjectDto } from './dto/create-exam-subject.dto';
import { UpdateExamSubjectDto } from './dto/update-exam-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamSubject } from './entities/exam-subject.entity';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { SubjectsService } from 'src/subjects/subjects.service';
import { ExamSubjectQueryDto } from './dto/exam-subject-query.dto';
import paginatedData, { paginatedRawData } from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { examSubjectSelectCols } from './helpers/exam-subject-select-cols';
import { Cache } from 'cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Exam } from '../exams/entities/exam.entity';

@Injectable()
export class ExamSubjectsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    @InjectRepository(ExamSubject) private examSubjectRepo: Repository<ExamSubject>,
    private readonly subjectsService: SubjectsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { super(dataSource, req); }

  async create(createExamSubjectDto: CreateExamSubjectDto) {
    const exam = await this.getRepository(Exam).findOneOrFail({
      where: { id: createExamSubjectDto.examId },
      relations: ['classRoom'],
      select: {
        id: true,
        classRoom: { id: true }
      }
    });
    const subject = await this.subjectsService.findOne(createExamSubjectDto.subjectId);

    // validate if the subject is in the class room
    if (subject.classRoom?.id !== exam.classRoom?.id) throw new BadRequestException('Subject is not in the class room of the exam');

    const newExamSubject = this.examSubjectRepo.create({
      ...createExamSubjectDto,
      exam,
      subject,
    });

    await this.examSubjectRepo.save(newExamSubject);

    return {
      message: 'Exam subject created',
    }
  }

  async findAll(queryDto: ExamSubjectQueryDto) {
    const querybuilder = this.examSubjectRepo.createQueryBuilder('examSubject');

    const currentAcademicYearId: string = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    querybuilder
      .orderBy("examSubject.examDate", queryDto.order)
      .offset(queryDto.skip)
      .limit(queryDto.take)
      .leftJoin('examSubject.exam', 'exam')
      .where("exam.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
      .leftJoin('exam.classRoom', 'classRoom')
      .leftJoin('exam.examType', 'examType')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('examSubject.subject', 'subject')
      .andWhere(new Brackets(qb => {
        queryDto.examId && qb.andWhere("exam.id = :examId", { examId: queryDto.examId })
        queryDto.onlyPast && qb.andWhere("DATE(exam.examDate) < CURRENT_DATE()")
        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId })
        queryDto.examTypeId && qb.andWhere('exam.examTypeId = :examTypeId', { examTypeId: queryDto.examTypeId })
      }))
      .select(examSubjectSelectCols)

      return paginatedRawData(queryDto, querybuilder);
  }

  async findByIds(ids: string[]) {
    return this.examSubjectRepo.find({
      where: { id: In(ids) },
      relations: ['subject'],
      select: {
        subject: {
          id: true,
          subjectName: true,
        }
      }
    });
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
