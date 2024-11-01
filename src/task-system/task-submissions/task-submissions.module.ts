import { Module } from '@nestjs/common';
import { TaskSubmissionsService } from './task-submissions.service';
import { TaskSubmissionsController } from './task-submissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSubmission } from './entities/task-submission.entity';
import { StudentsModule } from 'src/students/students.module';
import { FilesModule } from 'src/file-management/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskSubmission,
    ]),
    StudentsModule,
    FilesModule,
  ],
  controllers: [TaskSubmissionsController],
  providers: [TaskSubmissionsService],
})
export class TaskSubmissionsModule { }
