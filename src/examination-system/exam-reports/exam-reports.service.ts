import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamReportDto } from './dto/create-exam-report.dto';
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

  async mutate(createExamReportDto: CreateExamReportDto) {
    /**
    |--------------------------------------------------
    | for each evaluation, it is assumed that each has same subject
    |--------------------------------------------------
    */

    // get exam subject
    const examSubject = await this.getRepository(ExamSubject).findOne({
      where: { id: createExamReportDto.examSubjectId },
      relations: { subject: true },
      select: { id: true, theoryFM: true, practicalFM: true, examDate: true, subject: { id: true, subjectName: true } }
    });
    if (!examSubject) throw new NotFoundException('Exam subject not found');

    // check if examsubject is being evaluated before exam date
    // if (new Date(examSubject.examDate) > new Date()) throw new BadRequestException('Cannot evaluate before exam date.'); // TODO: uncomment this

    // create instances of exam reports
    const examReports = await Promise.all(createExamReportDto.evaluations?.map(async (evaluation) => {
      const student = await this.getRepository(Student).findOne({ // TODO: it is assumed that student is of current academic year
        where: { id: evaluation.studentId },
        select: { id: true, rollNo: true }
      });
      if (!student) throw new NotFoundException('Student not found');

      const theoryOM = evaluation.theoryOM;
      const practicalOM = evaluation.practicalOM;

      // validate if obtained mark is greater that exam subject full mark
      if (theoryOM > examSubject.theoryFM) {
        throw new BadRequestException(`Theory obtained mark of student with Roll no. ${student.rollNo} of subject ${examSubject.subject.subjectName} cannot be greater than full mark ${examSubject.theoryFM}`);
      }
      if (practicalOM > examSubject.practicalFM) {
        throw new BadRequestException(`Practical obtained mark of student with Roll no. ${student.rollNo} of subject ${examSubject.subject.subjectName} cannot be greater than full mark ${examSubject.practicalFM}`);
      }

      const percentage = ((theoryOM + practicalOM) / (examSubject.theoryFM + examSubject.practicalFM)) * 100;

      const { gpa, grade } = await this.getGpaAndGrade(percentage);

      return this.getRepository(ExamReport).create({
        id: evaluation.reportId,
        examSubject,
        student,
        theoryOM,
        practicalOM,
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
      gpa: +((percentage / 100) * examGrade.gradeScale).toFixed(2),
      grade: examGrade?.gradeName
    }
  }

  async findAll(queryDto: ExamReportQueryDto) {
    const querybuilder = this.getRepository(ExamReport).createQueryBuilder('examReport');

    querybuilder
      .orderBy("examReport.createdAt", queryDto.order)
      .skip(queryDto.skipPagination ? undefined : queryDto.skip)
      .take(queryDto.skipPagination ? undefined : queryDto.take)
      .leftJoin("examReport.examSubject", "examSubject")
      .leftJoin("examReport.student", "student")
      .where(new Brackets(qb => {
        queryDto.examSubjectId && qb.andWhere("examSubject.id = :examSubjectId", { examSubjectId: queryDto.examSubjectId });
      }))
      .select([
        "examReport.id",
        "examReport.createdAt",
        "examReport.theoryOM",
        "examReport.practicalOM",
        "examReport.percentage",
        "examReport.gpa",
        "examReport.grade",
        "student.id",
      ])

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
