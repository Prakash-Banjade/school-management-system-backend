import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { CurrentUser } from 'src/core/decorators/user.decorator';
import { Action, AuthUser } from 'src/core/types/global.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChekcAbilities } from 'src/core/decorators/abilities.decorator';

@ApiBearerAuth()
@ApiTags('Leave Requests')
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) { }

  @Post()
  create(@Body() createLeaveRequestDto: CreateLeaveRequestDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.create(createLeaveRequestDto, currentUser);
  }

  @Get()
  findAll(@Query() queryDto: LeaveRequestQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeaveRequestDto: UpdateLeaveRequestDto) {
    return this.leaveRequestsService.update(id, updateLeaveRequestDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.leaveRequestsService.remove(id);
  }
}
