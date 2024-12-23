import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { StaffsHelper } from './helpers/staffs.helper';
import { EmployeeAttendanceQueryDto } from 'src/teachers/dto/employee-attendance-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags("Staffs")
@Controller('staffs')
export class StaffsController {
  constructor(
    private readonly staffsService: StaffsService,
    private readonly staffsHelper: StaffsHelper,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createStaffDto: CreateStaffDto, @CurrentUser() currentUser: AuthUser) {
    return this.staffsService.create(createStaffDto, currentUser);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiPaginatedResponse(CreateStaffDto)
  findAll(@Query() queryDto: StaffQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.staffsService.findAll(queryDto, currentUser);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiPaginatedResponse(CreateStaffDto)
  getOptions(@Query() queryDto: StaffQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.staffsService.getOptions(queryDto, currentUser);
  }

  @Get('attendances')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getAttendance(@Query() queryDto: EmployeeAttendanceQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.staffsHelper.getStaffsWithAttendance(queryDto, currentUser);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.staffsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto, @CurrentUser() currentUser: AuthUser) {
    return this.staffsService.update(id, updateStaffDto, currentUser);
  }
}
