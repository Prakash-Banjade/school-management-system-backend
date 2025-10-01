import { Module } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { ClassRoomsController } from './class-rooms.controller';
import { ClassRoomsHelper } from './helpers/class-rooms.helper';
import { ClassRoomsStatistics } from './helpers/class-rooms.statistics';
import { FeeStructuresModule } from 'src/finance-system/fee-management/fee-structures/fee-structures.module';
import { AcademicYearsModule } from 'src/academic-years/academic-years.module';
import { ClassRoomsTeacherViewService } from './helpers/class-rooms_teacher-view.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { AuthModule } from 'src/auth-system/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassRoom,
    ]),
    FeeStructuresModule,
    AcademicYearsModule,
    AuthModule,
  ],
  controllers: [ClassRoomsController],
  providers: [ClassRoomsService, ClassRoomsHelper, ClassRoomsStatistics, ClassRoomsTeacherViewService],
  exports: [ClassRoomsService],
})
export class ClassRoomsModule { }
