import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ParseUUIDPipe } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeacherQueryDto } from './dto/teacher-query.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { EmployeeAttendanceQueryDto } from './dto/employee-attendance-query.dto';
import { TeachersHelper } from './helpers/teacher.helper';
import { QueryDto } from 'src/common/dto/query.dto';
import { isStudent } from 'src/utils/isStudent';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { TeachersStudentViewService } from './teachers.student-view.service';

@ApiBearerAuth()
@ApiTags('Teachers')
@Controller('teachers')
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly teachersHelper: TeachersHelper,
    private readonly teachersStudentViewService: TeachersStudentViewService
  ) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createTeacherDto: CreateTeacherDto, @CurrentUser() currentUser: AuthUser) {
    return this.teachersService.create(createTeacherDto, currentUser);
  }

  @Get()
  @ApiPaginatedResponse(CreateTeacherDto)
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findAll(@Query() queryDto: TeacherQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.teachersStudentViewService.findAll(queryDto, currentUser)
      : this.teachersService.findAll(queryDto, currentUser);
  }

  @Get('attendances')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getAttendance(@Query() queryDto: EmployeeAttendanceQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.teachersHelper.getTeachersWithAttendance(queryDto, currentUser);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getTeacherOptions(@Query() queryDto: QueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.teachersHelper.getTeacherOptions(queryDto, currentUser);
  }

  @Get(':id/details') // used in single teacher page in frontend
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersHelper.getDetails(id);
  }

  @Get(':id/class-schedule') // used in single teacher page in frontend
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getClassSchedule(@Param('id', ParseUUIDPipe) id: string, @Query('dayOfTheWeek') dayOfTheWeek?: string) {
    return this.teachersHelper.getClassSchedule(id, dayOfTheWeek);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.remove(id);
  }
}
