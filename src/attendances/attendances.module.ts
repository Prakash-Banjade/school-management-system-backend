import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendancesHelper } from './helpers/attendances.helper';
import { AttendanceCron } from './attedance.cron';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Staff } from 'src/staffs/entities/staff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      Teacher,
      Staff,
    ]),
  ],
  controllers: [AttendancesController],
  providers: [
    AttendancesService,
    AttendancesHelper,
    AttendanceCron,
  ],
  exports: [
    AttendancesHelper
  ]
})
export class AttendancesModule { }
