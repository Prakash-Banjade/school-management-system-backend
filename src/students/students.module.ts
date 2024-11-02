import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { ClassRoomsModule } from 'src/class-rooms/class-rooms.module';
import { DormitoryRoomsModule } from 'src/dormitory-system/dormitory-rooms/dormitory-rooms.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { ImagesModule } from 'src/file-management/images/images.module';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { StudentsHelper } from './helpers/students.helper';
import { Attendance } from 'src/attendances/entities/attendance.entity';
import { FilesModule } from 'src/file-management/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
    ]),
    ClassRoomsModule,
    ImagesModule,
    AccountsModule,
    DormitoryRoomsModule,
    EnrollmentsModule,
    FilesModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsHelper],
  exports: [StudentsService],
})
export class StudentsModule { }
