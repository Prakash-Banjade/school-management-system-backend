import { Module } from '@nestjs/common';
import { ExamResultsService } from './exam-results.service';
import { ExamResultsController } from './exam-results.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamResult } from './entities/exam-result.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Student } from 'src/students/entities/student.entity';
import { ExamReport } from '../exam-reports/entities/exam-report.entity';
import { ExamReportsModule } from '../exam-reports/exam-reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamResult,
      Exam,
      Student,
      ExamReport,
    ]),
    ExamReportsModule,
  ],
  controllers: [ExamResultsController],
  providers: [ExamResultsService],
  exports: [ExamResultsService],
})
export class ExamResultsModule { }
