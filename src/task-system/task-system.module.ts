import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';
import { TaskSubmissionsModule } from './task-submissions/task-submissions.module';

@Module({
    imports: [
        TasksModule,
        TaskSubmissionsModule,
    ]
})
export class TaskSystemModule {}
