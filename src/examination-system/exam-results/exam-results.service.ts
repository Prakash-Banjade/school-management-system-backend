import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ExamResult } from './entities/exam-result.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Student } from 'src/students/entities/student.entity';
import { ExamReport } from '../exam-reports/entities/exam-report.entity';
import { ESubjectType } from 'src/common/types/global.type';
import { WEAK_PERCENTAGE_THRESHOLD } from 'src/common/CONSTANTS';
import { ExamReportsService } from '../exam-reports/exam-reports.service';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { BaseRepository } from 'src/common/repository/base-repository';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { ExamResultQueryDto } from './dto/exam-result-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { ExamSubject } from '../exam-subjects/entities/exam-subject.entity';

@Injectable()
export class ExamResultsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @InjectRepository(ExamResult) private examResultRepo: Repository<ExamResult>,
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(ExamReport) private examReportRepo: Repository<ExamReport>,
    private readonly examReportsService: ExamReportsService,
    private readonly utilitiesService: UtilitiesService,
  ) { super(dataSource, req) }

  async generate(exam: Exam) {
    const classRoomIds = [exam.classRoom.id, ...exam.classRoom.children.map(classRoom => classRoom.id)];

    const students = await this.studentRepo.createQueryBuilder('student')
      .innerJoin('student.enrollments', 'enrollment', "enrollment.academicYearId = :academicYearId", { academicYearId: exam.academicYear.id })
      .leftJoin('student.classRoom', 'classRoom')
      .leftJoinAndSelect('student.optionalSubjects', 'optionalSubjects')
      .leftJoinAndSelect('optionalSubjects.subject', 'subject')
      .where('classRoom.id IN (:...classRoomIds)', { classRoomIds })
      .orWhere('classRoom.parentId IN (:...classRoomIds)', { classRoomIds })
      .select([
        'student.id',
        'optionalSubjects.id',
        'subject.id',
      ])
      .getMany();

    const examResults = await Promise.all(students.map(async (student) => {
      const subjectsWithOptional = exam.examSubjects.filter(examSub => { // removing optional subjects for which student has not selected
        return examSub.subject.type === ESubjectType.OPTIONAL
          ? student.optionalSubjects.some(optionalSub => optionalSub.subject.id === examSub.subject.id)
          : true;
      });

      // fetching exam reports of each subject of student
      const examSubjects = await Promise.all(subjectsWithOptional.map(async (examSubject) => {
        const report = await this.examReportRepo.findOne({
          where: { student: { id: student.id }, examSubject: { id: examSubject.id } },
          select: { id: true, theoryOM: true, practicalOM: true, percentage: true, grade: true, gpa: true },
        });

        examSubject.examReports = report ? [report] : [];

        return examSubject;
      }));

      // sum the obtained marks of all exam subjects and evaluate corresponding percentage, grade and gpa
      let totalObtainedMarks = 0;
      let fullMarks = 0;

      examSubjects?.forEach(examSubject => {
        fullMarks += examSubject.theoryFM + examSubject.practicalFM;
        totalObtainedMarks += examSubject.examReports[0]
          ? (examSubject.examReports[0].theoryOM + examSubject.examReports[0].practicalOM)
          : 0;
      });

      const percentage = +((totalObtainedMarks / fullMarks) * 100).toFixed(2);

      const { gpa, grade } = await this.examReportsService.getGpaAndGrade(percentage);

      const failedSubjectsCount = examSubjects?.filter(examSubject => (
        (examSubject.examReports[0]?.theoryOM < examSubject.theoryPM) || (examSubject.examReports[0]?.practicalOM < examSubject.practicalPM)
      )).length;

      const weakSubjects = examSubjects?.filter(es => es.examReports[0]?.percentage < WEAK_PERCENTAGE_THRESHOLD).map(es => es.subject.subjectName);

      return this.examResultRepo.create({
        student,
        exam,
        percentage,
        gpa,
        grade,
        failedSubjectsCount,
        weakSubjects,
      });
    }));

    await this.examResultRepo.save(examResults);
  }

  async findAll(queryDto: ExamResultQueryDto) {
    const academicYearId = await this.utilitiesService.getAcademicYearId();

    const querybuilder = this.examResultRepo.createQueryBuilder('examResult')
      .orderBy('examResult.percentage', 'DESC')
      .take(queryDto.take)
      .skip(queryDto.skip)
      .innerJoin(
        "examResult.exam",
        "exam",
        "exam.academicYearId = :academicYearId AND exam.examTypeId = :examTypeId AND exam.classRoomId = :classRoomId",
        { academicYearId, examTypeId: queryDto.examTypeId, classRoomId: queryDto.classRoomId },
      )
      .leftJoin("examResult.student", "student")
      .leftJoin("exam.examSubjects", "examSubjects")
      .leftJoin("examSubjects.subject", "subject")
      .leftJoin("examSubjects.examReports", "examReports", "examReports.studentId = student.id") // ensure examReports are for the same student only, if no condition, all examReports will be fetched
      .select([
        'examResult.id',
        'examResult.percentage',
        'examResult.gpa',
        'examResult.grade',
        'student.id',
        'student.firstName',
        'student.lastName',
        'student.studentId',
        'exam.id',
        'examSubjects.id',
        'examReports.id',
        'examReports.theoryOM',
        'examReports.practicalOM',
        'examReports.percentage',
        'examReports.gpa',
        'examReports.grade',
      ]);

    const examSubjectsQuerybuilder = this.getRepository(ExamSubject).createQueryBuilder('examSubject')
      .leftJoin('examSubject.exam', 'exam')
      .leftJoin('examSubject.subject', 'subject')
      .where("exam.academicYearId = :academicYearId", { academicYearId })
      .andWhere("exam.examTypeId = :examTypeId", { examTypeId: queryDto.examTypeId })
      .andWhere("exam.classRoomId = :classRoomId", { classRoomId: queryDto.classRoomId })
      .select([
        'examSubject.id',
        'examSubject.theoryFM',
        'examSubject.theoryPM',
        'examSubject.practicalFM',
        'examSubject.practicalPM',
        'subject.id',
        'subject.subjectName',
        'subject.subjectCode',
        'subject.type',
      ])

    const [examSubjects, data] = await Promise.all([
      examSubjectsQuerybuilder.getMany(),
      paginatedData(queryDto, querybuilder)
    ]);

    return {
      examSubjects,
      ...data,
    }
  }

  findOne(id: string) {
    return this.examResultRepo.findOne({
      where: { id },
    });
  }
}
