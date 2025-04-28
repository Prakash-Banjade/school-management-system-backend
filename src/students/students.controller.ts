import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentClassDto, UpdateStudentDto } from './dto/update-student.dto';
import { PastStudentsQueryDto, StudentAttendanceQueryDto, StudentQueryDto } from './dto/student-query.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { StudentsHelper } from './helpers/students.helper';

@ApiBearerAuth()
@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly studentsHelper: StudentsHelper,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student created successfully.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  @ApiResponse({ status: 200, description: 'List of students returned successfully.' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  findAll(@Query() queryDto: StudentQueryDto) {
    return this.studentsHelper.findAll(queryDto);
  }

  @Get('past')
  @ApiOperation({ summary: 'Get all past students of specified academic year who has not any enrollment in current academic year. Used in frontend in students promotion' })
  @ApiResponse({ status: 200, description: 'List of all past students returned successfully.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAllFromPast(@Query() queryDto: PastStudentsQueryDto) {
    return this.studentsHelper.getPastStudents(queryDto);
  }

  @Get('attendances')
  @ApiOperation({ summary: 'Get all students with attendance of specified date.' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
  )
  findAllAttendance(@Query() queryDto: StudentAttendanceQueryDto) {
    return this.studentsHelper.getStudentsWithAttendance(queryDto);
  }

  @Get('library/:studentId')
  @ApiOperation({ summary: 'Find student with library info. Used in frontend in issue/return page.' })
  @ApiParam({ name: 'studentId', required: true, description: 'studentId of the student' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findLibraryStudent(@Param('studentId') studentId: string) {
    return this.studentsService.findLibraryStudent(studentId);
  }

  @Get('fee/:studentId')
  @ApiOperation({ summary: 'Find student with fee info. Used in frontend in student billings page.' })
  @ApiParam({ name: 'studentId', required: true, description: 'studentId of the student' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findFeeStudent(@Param('studentId') studentId: string) {
    return this.studentsHelper.getFeeStudent(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Unique ID of the student' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch('change-class')
  @ApiOperation({ summary: 'Change students class' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  updateClass(@Body() updateStudentClassDto: UpdateStudentClassDto) {
    return this.studentsService.updateClassRoom(updateStudentClassDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update single student' })
  @ApiParam({ name: 'id', required: true, description: 'Unique ID of the student' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }
}
