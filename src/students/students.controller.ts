import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentClassDto, UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';
import { StudentAttendanceQueryDto } from './dto/student-attendance-query.dto';

@ApiBearerAuth()
@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateStudentDto)
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: StudentQueryDto) {
    return this.studentsService.findAll(queryDto);
  }

  @Get('attendances')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAllAttendance(@Query() queryDto: StudentAttendanceQueryDto) {
    return this.studentsService.getStudentsAttendance(queryDto);
  }

  @Get('library/:studentId')
  @ApiOperation({ summary: 'Find library student' })
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findLibraryStudent(@Param('studentId') studentId: string) {
    return this.studentsService.findLibraryStudent(studentId);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch('change-class')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  updateClass(@Body() updateStudentClassDto: UpdateStudentClassDto) {
    return this.studentsService.updateClassRoom(updateStudentClassDto);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
