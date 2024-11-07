import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { AttendanceCountQueryDto } from './dto/attendance-count-query.dto';
import { AttendancesHelper } from './helpers/attendances.helper';
import { UpdateAttendanceBatchDto } from './dto/update-attendance-batch.dto';

@ApiBearerAuth()
@ApiTags('Attendances')
@Controller('attendances')
export class AttendancesController {
  constructor(
    private readonly attendancesService: AttendancesService,
    private readonly attendancesHelper: AttendancesHelper
  ) { }

  @Post()
  @CheckAbilities({ action: Action.CREATE, subject: Role.ADMIN })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateAttendanceDto)
  // @CheckAbilities({ action: Action.CREATE, subject: Role.ADMIN })
  findAll(@Query() queryDto: AttendanceQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.attendancesService.findAll(queryDto, currentUser);
  }

  @Get('count')
  // @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  getCount(@Query() queryDto: AttendanceCountQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.attendancesHelper.getCount(queryDto, currentUser);
  }

  @Get(':id')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findOne(@Param('id') id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch('batch')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  updateInBatch(@Body() updateAttendanceBatchDto: UpdateAttendanceBatchDto) {
    return this.attendancesService.updateInBatch(updateAttendanceBatchDto);
  }

  @Patch(':id')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
