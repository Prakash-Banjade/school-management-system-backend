import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { AttendanceCountQueryDto } from './dto/attendance-count-query.dto';
import { AttendancesHelper } from './helpers/attendances.helper';
import { UpdateAttendanceBatchDto } from './dto/update-attendance-batch.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

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
  @ApiOperation({ summary: 'Create a new attendance record' })
  @ApiResponse({ status: 201, description: 'The attendance record has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateAttendanceDto)
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  @ApiOperation({ summary: 'Get a list of attendance records' })
  @ApiResponse({ status: 200, description: 'A paginated list of attendance records.' })
  findAll(@Query() queryDto: AttendanceQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.attendancesService.findAll(queryDto, currentUser);
  }

  @Get('count')
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  @ApiOperation({ summary: 'Get the attendance count for a user' })
  @ApiResponse({ status: 200, description: 'Attendance count retrieved successfully.' })
  getCount(@Query() queryDto: AttendanceCountQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.attendancesHelper.getCount(queryDto, currentUser);
  }

  @Get(':id')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  @ApiOperation({ summary: 'Get a specific attendance record by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the attendance record' })
  @ApiResponse({ status: 200, description: 'The attendance record has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Attendance record not found.' })
  findOne(@Param('id') id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch('batch')
  @CheckAbilities(
    { action: Action.UPDATE, subject: Role.ADMIN },
    { action: Action.UPDATE, subject: Role.TEACHER }
  )
  @UseInterceptors(TransactionInterceptor)
  @ApiOperation({ summary: 'Update multiple attendance records in a batch' })
  @ApiResponse({ status: 200, description: 'Attendance records have been successfully updated in batch.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 400, description: 'There must be in time to have out time.' })
  updateInBatch(@Body() updateAttendanceBatchDto: UpdateAttendanceBatchDto) {
    return this.attendancesService.updateInBatch(updateAttendanceBatchDto);
  }

  @Patch(':id')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  @ApiOperation({ summary: 'Update a specific attendance record by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the attendance record to update' })
  @ApiResponse({ status: 200, description: 'The attendance record has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Status or outTime required' })
  update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }
}
