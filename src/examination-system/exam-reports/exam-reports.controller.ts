import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamReportsService } from './exam-reports.service';
import { CreateExamReportDto } from './dto/create-exam-report.dto';
import { UpdateExamReportDto } from './dto/update-exam-report.dto';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Exam Reports')
@Controller('exam-reports')
export class ExamReportsController {
  constructor(private readonly examReportsService: ExamReportsService) { }

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
