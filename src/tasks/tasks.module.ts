import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { SubjectsModule } from 'src/subjects/subjects.module';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { ImagesModule } from 'src/file-management/images/images.module';
import { ClassRoomsModule } from 'src/class-rooms/class-rooms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
    ]),
    AccountsModule,
    ImagesModule,
    SubjectsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule { }
