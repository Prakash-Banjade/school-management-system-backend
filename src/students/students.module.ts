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

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]),
    ClassRoomsModule,
    ImagesModule,
    AccountsModule,
    DormitoryRoomsModule,
    EnrollmentsModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule { }
