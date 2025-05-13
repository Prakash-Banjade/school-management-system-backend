import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TeacherDashboardService } from './teacher-dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { TaskSubmission } from 'src/task-system/task-submissions/entities/task-submission.entity';
import { LeaveRequest } from 'src/leave-requests/entities/leave-request.entity';
import { AcademicYearsModule } from 'src/academic-years/academic-years.module';
import { StudentDashboardService } from './student-dashboard.service';
import { Exam } from 'src/examination-system/exams/entities/exam.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      ClassRoutine,
      ClassRoom,
      TaskSubmission,
      LeaveRequest,
      Exam
    ]),
    AcademicYearsModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService, TeacherDashboardService, StudentDashboardService],
})
export class DashboardModule { }
