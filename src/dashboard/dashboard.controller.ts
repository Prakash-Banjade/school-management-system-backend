import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { TeacherDashboardService } from './teacher-dashboard.service';
import { StudentDashboardService } from './student-dashboard.service';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly teacherDashboardService: TeacherDashboardService,
    private readonly studentDashboardService: StudentDashboardService,
  ) { }

  @Get('admin/counts')
  @ApiOperation({ summary: 'Get admin dashboard counts', description: 'Get total counts of students, teachers, staffs, classrooms' })
  @ApiResponse({ status: 200, description: 'Success' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboardCounts();
  }

  @Get('leave-requests')
  @ApiOperation({ summary: 'Get leave requests', description: 'Get leave requests of students and teachers along with total counts.' })
  @ApiResponse({ status: 200, description: 'Success' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000)
  getLeaveRequests() {
    return this.dashboardService.getLeaveRequests();
  }

  @Get('birthdays')
  @ApiOperation({ summary: 'Get today birthdays', description: 'Get today birthdays of students, teachers and staffs.' })
  @ApiResponse({ status: 200, description: 'Success' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000)
  getBirthdays() {
    return this.dashboardService.todayBirthdays();
  }

  @Get('teacher')
  @ApiOperation({ summary: 'Get dashboard count', description: 'Get dashboard count of teacher.' })
  @ApiResponse({ status: 200, description: 'Success' })
  @CheckAbilities({ subject: Role.TEACHER, action: Action.READ })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000)
  getTeacherDashboardCounts(@CurrentUser() currentUser: AuthUser) {
    return this.teacherDashboardService.getTeacherDashboardCounts(currentUser);
  }

  @Get('teacher/schedule')
  @ApiOperation({ summary: 'Get today schedule', description: 'Get today schedule of teacher.' })
  @ApiResponse({ status: 200, description: 'Success' })
  @CheckAbilities({ subject: Role.TEACHER, action: Action.READ })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000)
  getTodaySchedule(@CurrentUser() currentUser: AuthUser) {
    return this.teacherDashboardService.getTodaySchedule(currentUser);
  }

  
  @Get("student/upcomming-exams")
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  @ApiOperation({ summary: "Get upcomming exam list" })
  @ApiOkResponse({ description: "Exam fetched successfully" })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000)
  getUpcommingExam(@CurrentUser() currentUser: AuthUser) { // used in student dashboard}
    return this.studentDashboardService.getUpcommingExam(currentUser);
  }
}
