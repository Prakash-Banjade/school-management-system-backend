import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamSubjectDto } from './dto/create-exam-subject.dto';
import { UpdateExamSubjectDto } from './dto/update-exam-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamSubject } from './entities/exam-subject.entity';
import { Brackets, Repository } from 'typeorm';
import { ExamsService } from '../exams/exams.service';
import { SubjectsService } from 'src/subjects/subjects.service';
import { ExamSubjectQueryDto } from './dto/exam-subject-query.dto';
import paginatedData from 'src/core/utils/paginatedData';

@Injectable()
export class ExamSubjectsService {
  constructor(
    @InjectRepository(ExamSubject) private examSubjectRepo: Repository<ExamSubject>,
    private readonly examsService: ExamsService,
    private readonly subjectsService: SubjectsService,
  ) { }

  async create(createExamSubjectDto: CreateExamSubjectDto) {
    const exam = await this.examsService.findOne(createExamSubjectDto.examId);
    const subject = await this.subjectsService.findOne(createExamSubjectDto.subjectId);

    // validate if the subject is in the class room
    if (subject.classRoom.id !== exam.classRoom.id) throw new BadRequestException('Subject is not in the class room of the exam');

    const newExamSubject = this.examSubjectRepo.create({
      ...createExamSubjectDto,
      exam,
      subject,
    });

    const savedExamSubject = await this.examSubjectRepo.save(newExamSubject);

    return {
      message: 'Exam subject created successfully',
      examSubject: {
        id: savedExamSubject.id,
        subjectName: savedExamSubject.subject.subjectName,
      }
    }
  }

  async findAll(queryDto: ExamSubjectQueryDto) {
    const querybuilder = this.examSubjectRepo.createQueryBuilder('examSubject');

    querybuilder
      .orderBy("examSubject.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoinAndSelect('examSubject.exam', 'exam')
      .where(new Brackets(qb => {
        queryDto.examId && qb.andWhere("exam.id = :examId", { examId: queryDto.examId })
      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.examSubjectRepo.findOne({
      where: {
        id
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
    const savedExamSubject = await this.examSubjectRepo.save(existing);

    return {
      message: 'Exam subject updated successfully',
      examSubject: {
        id: savedExamSubject.id,
        subjectName: savedExamSubject.subject.subjectName,
      }
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const deleted = await this.examSubjectRepo.remove(existing);

    return {
      message: 'Exam subject deleted successfully',
      examSubject: {
        id: deleted.id,
        subjectName: deleted.subject.subjectName,
      }
    }
  }
}
