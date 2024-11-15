import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseInterceptors } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto, ExamReportByStudentQueryDto, ExamStudentsQueryDto } from './dto/exam-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { ExamsHelper } from './helpers/exams.helper';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { isStudent } from 'src/utils/isStudent';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Exams')
@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
    private readonly examsHelper: ExamsHelper,
  ) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findAll(@Query() queryDto: ExamQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.examsService.findAll(queryDto, currentUser);
  }

  @Get('report/by-student')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  getExamReportByStudent(@Query() queryDto: ExamReportByStudentQueryDto, @CurrentUser() currentUser: AuthUser) {
    if (isStudent(currentUser)) queryDto.studentId = currentUser.studentId;
    return this.examsHelper.getExamReportByStudent(queryDto.studentId, queryDto.examTypeId);
  }

  @Get(':id/students')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  getExamStudents(@Param('id', ParseUUIDPipe) id: string, @Query() queryDto: ExamStudentsQueryDto) {
    return this.examsHelper.getExamStudents(id, queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Query() queryDto: ExamQueryDto) {
    return this.examsService.findOne(id, queryDto);
  }

  @Patch(':id')
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.remove(id);
  }
}
