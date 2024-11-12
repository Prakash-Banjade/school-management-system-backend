import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamReportsService } from './exam-reports.service';
import { CreateExamReportDto } from './dto/create-exam-report.dto';
import { UpdateExamReportDto } from './dto/update-exam-report.dto';
import { ExamReportBySubjectQueryDto, ExamReportQueryDto } from './dto/exam-report-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { ExamReportsHelper } from './helpers/exam-reports.helper';

@ApiBearerAuth()
@ApiTags('Exam Reports')
@Controller('exam-reports')
export class ExamReportsController {
  constructor(
    private readonly examReportsService: ExamReportsService,
    private readonly examReportsHelper: ExamReportsHelper,
  ) { }

  @Patch()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  mutate(@Body() createExamReportDto: CreateExamReportDto) {
    return this.examReportsService.mutate(createExamReportDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: ExamReportQueryDto) {
    return this.examReportsService.findAll(queryDto);
  }

  @Get('report/by-subject')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getExamReportBySubject(@Query() queryDto: ExamReportBySubjectQueryDto) { // used in Examination Report Subject-wise page
    return this.examReportsHelper.getExamReportBySubject(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.examReportsService.findOne(id);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.examReportsService.remove(id);
  }
}
