import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { SubjectsModule } from 'src/subjects/subjects.module';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { FilesModule } from 'src/file-management/files/files.module';
import { TaskStudentViewService } from './task.student-view.service';
import { TasksCron } from './tasks.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
    ]),
    AccountsModule,
    FilesModule,
    SubjectsModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskStudentViewService,
    TasksCron
  ],
  exports: [TasksService],
})
export class TasksModule { }
