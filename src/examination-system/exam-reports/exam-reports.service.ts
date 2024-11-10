import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamReportDto } from './dto/create-exam-report.dto';
import { UpdateExamReportDto } from './dto/update-exam-report.dto';
import { ExamReport } from './entities/exam-report.entity';
import { Brackets, DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ExamSubjectsService } from '../exam-subjects/exam-subjects.service';
import { StudentsService } from 'src/students/students.service';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { MarksGrade } from '../marks-grades/entities/marks-grade.entity';
import paginatedData from 'src/utils/paginatedData';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Student } from 'src/students/entities/student.entity';

@Injectable()
export class ExamReportsService extends BaseRepository {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private req: FastifyRequest,
    private readonly examSubjectsService: ExamSubjectsService,
    private readonly studentsService: StudentsService,
  ) { super(dataSource, req); }

  async create(createExamReportDto: CreateExamReportDto) {
    /**
    |--------------------------------------------------
    | for each marks of each student, it is assumed that each has same subject
    |--------------------------------------------------
    */

    const examSubjects = await this.examSubjectsService.findByIds(createExamReportDto.evaluations[0]?.marks?.map(mark => mark.examSubjectId));
    if (examSubjects.length !== createExamReportDto.evaluations[0]?.marks?.length) throw new BadRequestException('Exam subjects not found');

    // check if examsubject is being evaluated before exam date
    // if (examSubjects.some(examSubject => new Date(examSubject.examDate) > new Date())) throw new BadRequestException('Cannot evaluate before exam date.'); 

    const examReports = (await Promise.all(createExamReportDto.evaluations?.flatMap(async (evaluation) => {
      const student = await this.getRepository(Student).findOne({ // TODO: it is assumed that student is of current academic year
        where: { id: evaluation.studentId },
        select: { id: true, rollNo: true }
      });
      if (!student) throw new NotFoundException('Student not found');

      return await Promise.all(examSubjects.map(async (examSubject, ind) => {
        const obtainedMark = evaluation.marks[ind].obtainedMarks;

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
    }))).flat();

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
