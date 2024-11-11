import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamReportDto } from './dto/create-exam-report.dto';
import { UpdateExamReportDto } from './dto/update-exam-report.dto';
import { ExamReport } from './entities/exam-report.entity';
import { Brackets, DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { MarksGrade } from '../marks-grades/entities/marks-grade.entity';
import paginatedData from 'src/utils/paginatedData';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Student } from 'src/students/entities/student.entity';
import { ExamSubject } from '../exam-subjects/entities/exam-subject.entity';

@Injectable()
export class ExamReportsService extends BaseRepository {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private req: FastifyRequest,
  ) { super(dataSource, req); }

  async create(createExamReportDto: CreateExamReportDto) {
    /**
    |--------------------------------------------------
    | for each evaluation, it is assumed that each has same subject
    |--------------------------------------------------
    */

    // get exam subject
    const examSubject = await this.getRepository(ExamSubject).findOne({
      where: { id: createExamReportDto.examSubjectId },
      relations: { subject: true },
      select: { id: true, fullMark: true, examDate: true, subject: { id: true, subjectName: true } }
    });
    if (!examSubject) throw new NotFoundException('Exam subject not found');

    // check if examsubject is being evaluated before exam date
    // if (new Date(examSubject.examDate) > new Date()) throw new BadRequestException('Cannot evaluate before exam date.');

    // create instances of exam reports
    const examReports = await Promise.all(createExamReportDto.evaluations?.map(async (evaluation) => {
      const student = await this.getRepository(Student).findOne({ // TODO: it is assumed that student is of current academic year
        where: { id: evaluation.studentId },
        select: { id: true, rollNo: true }
      });
      if (!student) throw new NotFoundException('Student not found');

      const obtainedMark = evaluation.obtainedMarks;

      if (obtainedMark > examSubject.fullMark) { // validate if obtained mark is greater that exam subject full mark
        throw new BadRequestException(`Obtained mark of student with Roll no. ${student.rollNo} of subject ${examSubject.subject.subjectName} cannot be greater than exam subject full mark ${examSubject.fullMark}`);
      }

      const percentage = (obtainedMark / examSubject.fullMark) * 100;

      const { gpa, grade } = await this.getGpaAndGrade(percentage);

      return this.getRepository(ExamReport).create({
        examSubject,
        student,
        obtainedMarks: obtainedMark,
        percentage: percentage,
        gpa,
        grade,
      });
    }));

    await this.getRepository(ExamReport).save(examReports);

    return {
      message: 'Evaluated Successfully',
    }
  }

  async getGpaAndGrade(percentage: number) {
    const examGrade = await this.getRepository(MarksGrade).findOne({
      where: {
        percentFrom: LessThanOrEqual(percentage),
        percentTo: MoreThanOrEqual(percentage),
      }
    });

    if (!examGrade) return { gpa: 0, grade: 'N/A' };

    return {
      gpa: (percentage / 100) * examGrade.gradeScale,
      grade: examGrade?.gradeName
    }
  }

  async findAll(queryDto: ExamReportQueryDto) {
    const querybuilder = this.getRepository(ExamReport).createQueryBuilder('examReport');

    querybuilder
      .orderBy("examReport.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {

      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(ExamReport).findOne({
      where: { id },
      relations: {
        examSubject: {
          subject: true,
        },
        student: true
      },
      select: {
        student: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    });

    if (!existing) throw new NotFoundException('Exam report not found');

    return existing;
  }

  async update(id: string, updateExamReportDto: UpdateExamReportDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateExamReportDto);

    const savedExamReport = await this.getRepository(ExamReport).save(existing);

    return {
      message: 'Exam report updated successfully',
      examReport: {
        id: savedExamReport.id,
        marksObtained: savedExamReport.obtainedMarks,
      }
    };

  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const deleted = await this.getRepository(ExamReport).remove(existing);

    return {
      message: 'Exam report deleted successfully',
      examReport: {
        id: deleted.id,
      }
    }
  }
}
