import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ClassRoomsModule } from 'src/class-rooms/class-rooms.module';
import { ExamTypesModule } from '../exam-types/exam-types.module';
import { ExamsHelper } from './helpers/exams.helper';
import { ExamReportsModule } from '../exam-reports/exam-reports.module';

@Module({
  imports: [
    ClassRoomsModule,
    ExamTypesModule,
    ExamReportsModule,
  ],  
  controllers: [ExamsController],
  providers: [ExamsService, ExamsHelper],
  exports: [ExamsService],
})
export class ExamsModule {}
