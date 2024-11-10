import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ClassRoomsModule } from 'src/class-rooms/class-rooms.module';
import { ExamTypesModule } from '../exam-types/exam-types.module';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { ExamsHelper } from './helpers/exams.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      AcademicYear,
      Subject
    ]),
    ClassRoomsModule,
    ExamTypesModule,
  ],  
  controllers: [ExamsController],
  providers: [ExamsService, ExamsHelper],
  exports: [ExamsService],
})
export class ExamsModule {}
