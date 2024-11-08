import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './dto/update-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';

@ApiBearerAuth()
@ApiTags('Leave Requests')
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createLeaveRequestDto: CreateLeaveRequestDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.create(createLeaveRequestDto, currentUser);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: LeaveRequestQueryDto, @CurrentUser() currentUser: AuthUser) { // only for students leave request
    return this.leaveRequestsService.findAll(queryDto, currentUser);
  }

  @Get('employees')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployeeLeaveRequests(@Query() queryDto: LeaveRequestQueryDto) { // only for teachers and staffs
    return this.leaveRequestsService.getEmployeeLeaveRequests(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  @Patch(':id/updateStatus')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  updateStatus(@Param('id') id: string, @Body() udpateLeaveRequestStatusDto: UpdateLeaveRequestStatusDto) {
    return this.leaveRequestsService.updateStatus(id, udpateLeaveRequestStatusDto);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  update(@Param('id') id: string, @Body() updateLeaveRequestDto: UpdateLeaveRequestDto) {
    return this.leaveRequestsService.update(id, updateLeaveRequestDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.leaveRequestsService.remove(id);
  }
}
