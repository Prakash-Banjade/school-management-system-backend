import { Module } from '@nestjs/common';
import { ExamSubjectsService } from './exam-subjects.service';
import { ExamSubjectsController } from './exam-subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSubject } from './entities/exam-subject.entity';
import { SubjectsModule } from 'src/subjects/subjects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamSubject,
    ]),
    SubjectsModule,
  ],
  controllers: [ExamSubjectsController],
  providers: [ExamSubjectsService],
  exports: [ExamSubjectsService],
})
export class ExamSubjectsModule {}
