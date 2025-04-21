import { Module } from '@nestjs/common';
import { TaskSubmissionsService } from './task-submissions.service';
import { TaskSubmissionsController } from './task-submissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSubmission } from './entities/task-submission.entity';
import { FilesModule } from 'src/file-management/files/files.module';
import { Task } from '../tasks/entities/task.entity';
import { Student } from 'src/students/entities/student.entity';
import { TaskSubmissionsStudentViewService } from './task-submissions.student-view.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskSubmission,
      Task,
      Student,
    ]),
    FilesModule,
  ],
  controllers: [TaskSubmissionsController],
  providers: [TaskSubmissionsService, TaskSubmissionsStudentViewService],
})
export class TaskSubmissionsModule { }
