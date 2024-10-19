import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { ClassRoomsModule } from 'src/class-rooms/class-rooms.module';
import { TeachersModule } from 'src/teachers/teachers.module';
import { SubjectChapter } from './entities/subject-chapter.entity';
import { SubjectChaptersController } from './subject-chapters.controller';
import { SubjectChaptersService } from './subject-chapters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      SubjectChapter
    ]),
    ClassRoomsModule,
    TeachersModule,
  ],
  controllers: [SubjectsController, SubjectChaptersController],
  providers: [SubjectsService, SubjectChaptersService],
  exports: [SubjectsService, SubjectChaptersService],
})
export class SubjectsModule { }
