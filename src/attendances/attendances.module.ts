import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { AttendancesHelper } from './helpers/attendances.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    AccountsModule,
  ],
  controllers: [AttendancesController],
  providers: [
    AttendancesService,
    AttendancesHelper,
  ],
})
export class AttendancesModule { }
