import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';
import { TaskSubmissionsModule } from './task-submissions/task-submissions.module';
import { TaskEvaluationsModule } from './task-evaluations/task-evaluations.module';

@Module({
    imports: [
        TasksModule,
        TaskSubmissionsModule,
        TaskEvaluationsModule,
    ]
})
export class TaskSystemModule {}
