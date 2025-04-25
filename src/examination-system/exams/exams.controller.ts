import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseInterceptors, ParseBoolPipe } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto, ExamReportByStudentQueryDto, ExamStudentsQueryDto } from './dto/exam-query.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { ExamsHelper } from './helpers/exams.helper';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { isStudent } from 'src/utils/utils';

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
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({ status: 201, description: 'Exam successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Class room or Exam type not found.' })
  @ApiResponse({ status: 409, description: 'Exam with provided exam type already exists for this academic year.' })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  @ApiOperation({ summary: 'Get all exams' })
  @ApiResponse({ status: 200, description: 'List of exams retrieved successfully.' })
  findAll(@Query() queryDto: ExamQueryDto) {
    return this.examsService.findAll(queryDto);
  }

  @Get('report/by-student')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  @ApiOperation({ summary: 'Get exam report for a student' })
  @ApiResponse({ status: 200, description: 'Exam report retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Student or exam report not found.' })
  getExamReportByStudent(@Query() queryDto: ExamReportByStudentQueryDto, @CurrentUser() currentUser: AuthUser) {
    if (isStudent(currentUser)) queryDto.studentId = currentUser.studentId;
    return this.examsHelper.getExamReportByStudent(queryDto.studentId, queryDto.examTypeId, currentUser);
  }

  @Get(':id/students')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get students assigned to a specific exam' })
  @ApiParam({ name: 'id', description: 'Exam ID to retrieve students for' })
  @ApiResponse({ status: 200, description: 'Students for the exam retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Exam not found.' })
  getExamStudents(@Param('id', ParseUUIDPipe) id: string, @Query() queryDto: ExamStudentsQueryDto) {
    return this.examsHelper.getExamStudents(id, queryDto);
  }

  @Get("upcomming")
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  @ApiOperation({ summary: "Get upcomming exam list" })
  @ApiOkResponse({ description: "Exam fetched successfully" })
  getUpcommingExam(@CurrentUser() currentUser: AuthUser) { // used in student dashboard}
    return this.examsHelper.getUpcommingExam(currentUser);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get a specific exam' })
  @ApiParam({ name: 'id', description: 'Exam ID to retrieve' })
  @ApiResponse({ status: 200, description: 'Exam retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Exam not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Query() queryDto: ExamQueryDto) {
    return this.examsService.findOne(id, queryDto);
  }

  @Patch(':id/publish')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @ApiOperation({ summary: 'Toggle the publish status of an existing exam' })
  @ApiParam({ name: 'id', description: 'Exam ID to update' })
  @ApiResponse({ status: 200, description: 'Exam updated successfully.' })
  publishReport(@Param('id', ParseUUIDPipe) id: string, @Query('publish', ParseBoolPipe) publish: boolean) {
    return this.examsService.publishReport(id, publish);
  }

  @Patch(':id')
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @ApiOperation({ summary: 'Update an existing exam' })
  @ApiParam({ name: 'id', description: 'Exam ID to update' })
  @ApiResponse({ status: 200, description: 'Exam updated successfully.' })
  @ApiResponse({ status: 404, description: 'Exam or Exam type not found.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  @ApiOperation({ summary: 'Delete a specific exam' })
  @ApiParam({ name: 'id', description: 'Exam ID to delete' })
  @ApiResponse({ status: 200, description: 'Exam successfully deleted.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.remove(id);
  }
}
