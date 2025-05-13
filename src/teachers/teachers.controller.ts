import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors, ParseUUIDPipe } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TeacherOptionsQueryDto, TeacherQueryDto } from './dto/teacher-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { EmployeeAttendanceQueryDto } from './dto/employee-attendance-query.dto';
import { TeachersHelper } from './helpers/teacher.helper';
import { TeachersStudentViewService } from './teachers.student-view.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { isStudent } from 'src/utils/utils';

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
  @ApiOperation({ summary: 'Create teacher' })
  @ApiConflictResponse({ description: 'Teacher already exists' })
  @ApiCreatedResponse({ description: 'Teacher created' })
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all teachers' })
  @ApiOkResponse({ description: 'Teachers found' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findAll(@Query() queryDto: TeacherQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.teachersStudentViewService.findAll(queryDto, currentUser)
      : this.teachersService.findAll(queryDto);
  }

  @Get('attendances')
  @ApiOperation({ summary: 'Find all teachers with attendance' })
  @ApiOkResponse({ description: 'Teachers found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getAttendance(@Query() queryDto: EmployeeAttendanceQueryDto) {
    return this.teachersHelper.getTeachersWithAttendance(queryDto);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get teacher options' })
  @ApiOkResponse({ description: 'Teacher options found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getTeacherOptions(@Query() queryDto: TeacherOptionsQueryDto) {
    return this.teachersHelper.getTeacherOptions(queryDto);
  }

  @Get('library/:teacherId')
  @ApiOperation({ summary: 'Find teacher with library info. Used in frontend in issue/return page.' })
  @ApiParam({ name: 'teacherId', required: true, description: 'teacherId of the teacher' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findLibraryStudent(@Param('teacherId') teacherId: string) {
    return this.teachersService.findLibraryTeacher(teacherId);
  }

  @Get(':id/details') // used in single teacher page in frontend
  @ApiOperation({ summary: 'Get teacher details' })
  @ApiOkResponse({ description: 'Teacher details found' })
  @ApiNotFoundResponse({ description: 'Teacher not found' })
  @ApiParam({ name: 'id', required: true, description: 'id of the teacher' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersHelper.getDetails(id);
  }

  @Get(':id/class-schedule') // used in single teacher page in frontend
  @ApiOperation({ summary: 'Get teacher class schedule' })
  @ApiOkResponse({ description: 'Teacher class schedule found' })
  @ApiParam({ name: 'id', required: true, description: 'id of the teacher' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getClassSchedule(@Param('id', ParseUUIDPipe) id: string, @Query('dayOfTheWeek') dayOfTheWeek?: string) {
    return this.teachersHelper.getClassSchedule(id, dayOfTheWeek);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find teacher' })
  @ApiOkResponse({ description: 'Teacher found' })
  @ApiParam({ name: 'id', required: true, description: 'id of the teacher' })
  @ApiNotFoundResponse({ description: 'Teacher not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update teacher' })
  @ApiParam({ name: 'id', required: true, description: 'id of the teacher' })
  @ApiOkResponse({ description: 'Teacher updated' })
  @ApiNotFoundResponse({ description: 'Teacher not found' })
  @ApiConflictResponse({ description: 'Teacher already exists' })
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }
}
