import { Module } from '@nestjs/common';
import { ExamReportsService } from './exam-reports.service';
import { ExamReportsController } from './exam-reports.controller';
import { ExamSubjectsModule } from '../exam-subjects/exam-subjects.module';
import { StudentsModule } from 'src/students/students.module';

@Module({
  imports: [
    ExamSubjectsModule,
    StudentsModule,
  ],
  controllers: [ExamReportsController],
  providers: [ExamReportsService],
})
export class ExamReportsModule {}
