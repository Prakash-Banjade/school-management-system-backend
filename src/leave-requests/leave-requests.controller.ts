import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto, UpdateLeaveRequestStatusDto } from './dto/update-leave-request.dto';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser } from 'src/common/types/global.type';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';

@ApiBearerAuth()
@ApiTags('Leave Requests')
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) { }

  @Post()
  // @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  create(@Body() createLeaveRequestDto: CreateLeaveRequestDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.create(createLeaveRequestDto, currentUser);
  }

  @Get()
  // @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: LeaveRequestQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.leaveRequestsService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  @Patch(':id/updateStatus')
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  updateStatus(@Param('id') id: string, @Body() udpateLeaveRequestStatusDto: UpdateLeaveRequestStatusDto) {
    return this.leaveRequestsService.updateStatus(id, udpateLeaveRequestStatusDto);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  update(@Param('id') id: string, @Body() updateLeaveRequestDto: UpdateLeaveRequestDto) {
    return this.leaveRequestsService.update(id, updateLeaveRequestDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.leaveRequestsService.remove(id);
  }
}
