import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser } from 'src/common/types/global.type';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
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
  @ChekcAbilities({ action: Action.CREATE, subject: 'all' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateAttendanceDto)
  // @ChekcAbilities({ action: Action.CREATE, subject: 'all' })
  findAll(@Query() queryDto: AttendanceQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.attendancesService.findAll(queryDto, currentUser);
  }

  @Get('count')
  // @ChekcAbilities({ action: Action.READ, subject: 'all' })
  getCount(@Query() queryDto: AttendanceCountQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.attendancesHelper.getCount(queryDto, currentUser);
  }

  @Get(':id')
  @ChekcAbilities({ action: Action.READ, subject: 'all' })
  findOne(@Param('id') id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch('batch')
  @ChekcAbilities({ action: Action.UPDATE, subject: 'all' })
  updateInBatch(@Body() updateAttendanceBatchDto: UpdateAttendanceBatchDto) {
    return this.attendancesService.updateInBatch(updateAttendanceBatchDto);
  }

  @Patch(':id')
  @ChekcAbilities({ action: Action.UPDATE, subject: 'all' })
  update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
