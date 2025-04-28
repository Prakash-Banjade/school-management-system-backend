import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './dto/update-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { BranchId } from 'src/common/decorators/branchId.decorator';

@ApiBearerAuth()
@ApiTags('Leave Requests')
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) { }

  @Post()
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE }
  )
  create(@Body() createLeaveRequestDto: CreateLeaveRequestDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.create(createLeaveRequestDto, currentUser);
  }

  @Get()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
  )
  findAll(@Query() queryDto: LeaveRequestQueryDto, @CurrentUser() currentUser: AuthUser, @BranchId() branchId: string) { // only for students leave request
    return this.leaveRequestsService.findAll(queryDto, currentUser, branchId);
  }

  @Get('employees')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployeeLeaveRequests(@Query() queryDto: LeaveRequestQueryDto, @BranchId() branchId: string) { // only for teachers and staffs
    return this.leaveRequestsService.getEmployeeLeaveRequests(queryDto, branchId);
  }

  @Get('me')
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  getMyLeaveRequests(@CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.getMyLeaveRequests(currentUser);
  }

  @Get(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.findOne(id, currentUser);
  }

  @Patch(':id/updateStatus')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE }
  )
  updateStatus(@Param('id') id: string, @Body() udpateLeaveRequestStatusDto: UpdateLeaveRequestStatusDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.updateStatus(id, udpateLeaveRequestStatusDto, currentUser);
  }

  @Patch(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE }
  )
  update(@Param('id') id: string, @Body() updateLeaveRequestDto: UpdateLeaveRequestDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.update(id, updateLeaveRequestDto, currentUser);
  }

  @Delete(':id')
  @CheckAbilities(
    { action: Action.DELETE, subject: Role.ADMIN },
    { action: Action.DELETE, subject: Role.TEACHER }
  )
  remove(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.remove(id, currentUser);
  }
}
