import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

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
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30 * 1000)
  getBirthdays() {
    return this.dashboardService.todayBirthdays();
  }
}
