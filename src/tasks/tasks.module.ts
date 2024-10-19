import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { SubjectsModule } from 'src/subjects/subjects.module';
import { UsersModule } from 'src/auth-system/users/users.module';
import { ImagesModule } from 'src/file-management/images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
    ]),
    UsersModule,
    ImagesModule,
    SubjectsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule { }
