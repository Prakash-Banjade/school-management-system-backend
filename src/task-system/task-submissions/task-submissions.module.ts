import { Module } from '@nestjs/common';
import { TaskSubmissionsService } from './task-submissions.service';
import { TaskSubmissionsController } from './task-submissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSubmission } from './entities/task-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskSubmission,
    ])
  ],
  controllers: [TaskSubmissionsController],
  providers: [TaskSubmissionsService],
})
export class TaskSubmissionsModule { }
