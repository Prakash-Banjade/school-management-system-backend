import { Module } from '@nestjs/common';
import { TaskEvaluationsService } from './task-evaluations.service';
import { TaskEvaluationsController } from './task-evaluations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEvaluation } from './entities/task-evaluation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEvaluation,
    ])
  ],
  controllers: [TaskEvaluationsController],
  providers: [TaskEvaluationsService],
})
export class TaskEvaluationsModule { }
