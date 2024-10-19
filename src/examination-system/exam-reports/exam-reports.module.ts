import { Module } from '@nestjs/common';
import { ExamReportsService } from './exam-reports.service';
import { ExamReportsController } from './exam-reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamReport } from './entities/exam-report.entity';
import { ExamSubjectsModule } from '../exam-subjects/exam-subjects.module';
import { StudentsModule } from 'src/students/students.module';
import { MarksGrade } from '../marks-grades/entities/marks-grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamReport,
      MarksGrade,
    ]),
    ExamSubjectsModule,
    StudentsModule,
  ],
  controllers: [ExamReportsController],
  providers: [ExamReportsService],
})
export class ExamReportsModule {}
