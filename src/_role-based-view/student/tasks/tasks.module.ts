import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from 'src/task-system/tasks/entities/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule { }
