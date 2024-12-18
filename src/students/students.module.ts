import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { DormitoryRoomsModule } from 'src/dormitory-system/dormitory-rooms/dormitory-rooms.module';
import { ImagesModule } from 'src/file-management/images/images.module';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { StudentsHelper } from './helpers/students.helper';
import { FilesModule } from 'src/file-management/files/files.module';
import { RouteStopsModule } from 'src/transportation-system/route-stops/route-stops.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
    ]),
    ImagesModule,
    AccountsModule,
    DormitoryRoomsModule,
    FilesModule,
    RouteStopsModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsHelper],
  exports: [StudentsService],
})
export class StudentsModule { }
