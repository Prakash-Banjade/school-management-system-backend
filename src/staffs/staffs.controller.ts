import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors, Delete } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { ApiBearerAuth, ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { StaffsHelper } from './helpers/staffs.helper';
import { EmployeeAttendanceQueryDto } from 'src/teachers/dto/employee-attendance-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags("Staffs")
@Controller('staffs')
export class StaffsController {
  constructor(
    private readonly staffsService: StaffsService,
    private readonly staffsHelper: StaffsHelper,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new staff' })
  @ApiResponse({ status: 201, description: 'Staff created successfully.' })
  @ApiConflictResponse({ description: 'Staff already exists with the provided details.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffsService.create(createStaffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all staffs' })
  @ApiResponse({ status: 200, description: 'List of staffs retrieved successfully.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiPaginatedResponse(CreateStaffDto)
  findAll(@Query() queryDto: StaffQueryDto) {
    return this.staffsService.findAll(queryDto);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get options for staffs' })
  @ApiResponse({ status: 200, description: 'Staff options retrieved successfully.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiPaginatedResponse(CreateStaffDto)
  getOptions(@Query() queryDto: StaffQueryDto) {
    return this.staffsService.getOptions(queryDto);
  }

  @Get('attendances')
  @ApiOperation({ summary: 'Get attendance of staffs' })
  @ApiResponse({ status: 200, description: 'Staffs with attendance retrieved successfully.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getAttendance(@Query() queryDto: EmployeeAttendanceQueryDto) {
    return this.staffsHelper.getStaffsWithAttendance(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve staff by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Unique ID of the staff' })
  @ApiResponse({ status: 200, description: 'Staff retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Staff not found with the provided ID.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.staffsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Unique ID of the staff' })
  @ApiResponse({ status: 200, description: 'Staff updated successfully.' })
  @ApiNotFoundResponse({ description: 'Staff not found with the provided ID.' })
  @ApiConflictResponse({ description: 'Staff already exists with the provided details.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffsService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete staff by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Unique ID of the staff' })
  @ApiResponse({ status: 200, description: 'Staff deleted successfully.' })
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.DELETE })
  delete(@Param('id') id: string) {
    return this.staffsService.delete(id);
  }
}
