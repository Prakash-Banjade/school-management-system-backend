import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ExamsHelper } from './helpers/exams.helper';
import { ExamReportsModule } from '../exam-reports/exam-reports.module';
import { ExamResultsModule } from '../exam-results/exam-results.module';

@Module({
  imports: [
    ExamReportsModule,
    ExamResultsModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService, ExamsHelper],
  exports: [ExamsService],
})
export class ExamsModule { }
