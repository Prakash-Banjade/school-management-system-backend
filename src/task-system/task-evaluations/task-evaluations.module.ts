import { Module } from '@nestjs/common';
import { TaskEvaluationsService } from './task-evaluations.service';
import { TaskEvaluationsController } from './task-evaluations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEvaluation } from './entities/task-evaluation.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { TaskSubmission } from '../task-submissions/entities/task-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEvaluation,
      Teacher,
      TaskSubmission,
    ])
  ],
  controllers: [TaskEvaluationsController],
  providers: [TaskEvaluationsService],
})
export class TaskEvaluationsModule { }
