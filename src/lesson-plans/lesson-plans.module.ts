import { Module } from '@nestjs/common';
import { LessonPlansService } from './lesson-plans.service';
import { LessonPlansController } from './lesson-plans.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonPlan } from './entities/lesson-plan.entity';
import { FilesModule } from 'src/file-management/files/files.module';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonPlan,
      ClassRoutine,
    ]),
    FilesModule,
  ],
  controllers: [LessonPlansController],
  providers: [LessonPlansService],
})
export class LessonPlansModule { }
