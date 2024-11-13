import { Module } from '@nestjs/common';
import { StudentOptionalSubjectService } from './student-optional-subject.service';
import { StudentOptionalSubjectController } from './student-optional-subject.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentOptionalSubject } from './entities/student-optional-subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentOptionalSubject,
    ])
  ],
  controllers: [StudentOptionalSubjectController],
  providers: [StudentOptionalSubjectService],
})
export class StudentOptionalSubjectModule { }
