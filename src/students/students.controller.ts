import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentClassDto, UpdateStudentDto } from './dto/update-student.dto';
import { PastStudentsQueryDto, StudentAttendanceQueryDto, StudentQueryDto } from './dto/student-query.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { isStudent } from 'src/utils/isStudent';
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
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateStudentDto)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: StudentQueryDto) {
    return this.studentsHelper.findAll(queryDto);
  }

  @Get('past')
  @ApiPaginatedResponse(CreateStudentDto)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAllFromPast(@Query() queryDto: PastStudentsQueryDto) {
    return this.studentsHelper.getPastStudents(queryDto);
  }

  @Get('attendances')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAllAttendance(@Query() queryDto: StudentAttendanceQueryDto) {
    return this.studentsService.getStudentsAttendance(queryDto);
  }

  @Get('library/:studentId')
  @ApiOperation({ summary: 'Find library student' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findLibraryStudent(@Param('studentId') studentId: string) {
    return this.studentsService.findLibraryStudent(studentId);
  }

  @Get('me')
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  getMyInfo(@CurrentUser() currentUser: AuthUser) {
    if (!isStudent(currentUser)) throw new ForbiddenException()
    return this.studentsService.findOne(currentUser.studentId);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch('change-class')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  updateClass(@Body() updateStudentClassDto: UpdateStudentClassDto) {
    return this.studentsService.updateClassRoom(updateStudentClassDto);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
