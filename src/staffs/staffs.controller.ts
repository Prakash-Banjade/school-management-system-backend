import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffsService.create(createStaffDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiPaginatedResponse(CreateStaffDto)
  findAll(@Query() queryDto: StaffQueryDto) {
    return this.staffsService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiPaginatedResponse(CreateStaffDto)
  getOptions(@Query() queryDto: StaffQueryDto) {
    return this.staffsService.getOptions(queryDto);
  }

  @Get('attendances')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getAttendance(@Query() queryDto: EmployeeAttendanceQueryDto) {
    return this.staffsHelper.getStaffsWithAttendance(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.staffsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffsService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.staffsService.remove(id);
  }
}
