import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamReportDto } from './dto/create-exam-report.dto';
import { UpdateExamReportDto } from './dto/update-exam-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamReport } from './entities/exam-report.entity';
import { Brackets, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ExamSubjectsService } from '../exam-subjects/exam-subjects.service';
import { StudentsService } from 'src/students/students.service';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import paginatedData from 'src/core/utils/paginatedData';
import { MarksGrade } from '../marks-grades/entities/marks-grade.entity';

@Injectable()
export class ExamReportsService {
  constructor(
    @InjectRepository(ExamReport) private examReportRepo: Repository<ExamReport>,
    @InjectRepository(MarksGrade) private readonly marksGradeRepo: Repository<MarksGrade>,
    private readonly examSubjectsService: ExamSubjectsService,
    private readonly studentsService: StudentsService,
  ) { }

  async create(createExamReportDto: CreateExamReportDto) {
    const examSubject = await this.examSubjectsService.findOne(createExamReportDto.examSubjectId);
    const student = await this.studentsService.findOne(createExamReportDto.studentId);

    // validate if obtained mark is greater that exam subject full mark
    if (createExamReportDto.obtainedMarks > examSubject.fullMark) throw new BadRequestException('Obtained marks cannot be greater than exam subject full mark');

    // EVALUATE PERCENTAGE
    const percentage = (createExamReportDto.obtainedMarks / examSubject.fullMark) * 100;

    // EVALUATE GPA
    const { gpa, grade } = await this.getGpaAndGrade(percentage);

    const newExamReport = this.examReportRepo.create({
      ...createExamReportDto,
      examSubject,
      student,
      percentage,
      gpa,
      grade,
    });

    return this.examReportRepo.save(newExamReport);
  }

  async getGpaAndGrade(percentage: number) {
    const examGrade = await this.marksGradeRepo.findOne({
      where: {
        percentFrom: LessThanOrEqual(percentage),
        percentTo: MoreThanOrEqual(percentage),
      }
    })

    return {
      gpa: examGrade?.gpa ?? 0,
      grade: examGrade?.gradeName ?? 'F'
    }
  }

  async findAll(queryDto: ExamReportQueryDto) {
    const querybuilder = this.examReportRepo.createQueryBuilder('examReport');

    querybuilder
      .orderBy("examReport.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {

      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.examReportRepo.findOne({
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

    const savedExamReport = await this.examReportRepo.save(existing);

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
    const deleted = await this.examReportRepo.remove(existing);

    return {
      message: 'Exam report deleted successfully',
      examReport: {
        id: deleted.id,
      }
    }
  }
}
