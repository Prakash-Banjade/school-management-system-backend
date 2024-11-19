import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('admin/counts')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboardCounts();
  }

  @Get('leave-requests')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getLeaveRequests() {
    return this.dashboardService.getLeaveRequests();
  }
}
