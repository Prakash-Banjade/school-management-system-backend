import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { FilesModule } from 'src/file-management/files/files.module';
import { TaskStudentViewService } from './task.student-view.service';
import { TasksCron } from './tasks.cron';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Account,
      ClassRoom,
      ClassRoutine,
    ]),
    FilesModule,
    // SubjectsModule,
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
