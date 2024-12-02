import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendancesHelper } from './helpers/attendances.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
  ],
  controllers: [AttendancesController],
  providers: [
    AttendancesService,
    AttendancesHelper,
  ],
  exports: [
    AttendancesHelper
  ]
})
export class AttendancesModule { }
