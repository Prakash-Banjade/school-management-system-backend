import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { SubjectChaptersController } from './subject-chapters.controller';
import { SubjectChaptersService } from './subject-chapters.service';

@Module({
  controllers: [SubjectsController, SubjectChaptersController],
  providers: [SubjectsService, SubjectChaptersService],
  exports: [SubjectsService, SubjectChaptersService],
})
export class SubjectsModule { }
