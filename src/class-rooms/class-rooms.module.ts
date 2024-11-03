import { Module } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { ClassRoomsController } from './class-rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { ClassRoomsHelper } from './helpers/class-rooms.helper';
import { Student } from 'src/students/entities/student.entity';
import { AcademicYearsModule } from 'src/academic-years/academic-years.module';
import { TeachersModule } from 'src/teachers/teachers.module';
import { ClassRoomsStatistics } from './helpers/class-rooms.statistics';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassRoom,
      Student
    ]),
    AcademicYearsModule,
    TeachersModule,
  ],
  controllers: [ClassRoomsController],
  providers: [ClassRoomsService, ClassRoomsHelper, ClassRoomsStatistics],
  exports: [ClassRoomsService],
})
export class ClassRoomsModule { }
