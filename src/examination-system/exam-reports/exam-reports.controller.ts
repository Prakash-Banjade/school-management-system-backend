import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamReportsService } from './exam-reports.service';
import { CreateExamReportDto } from './dto/create-exam-report.dto';
import { UpdateExamReportDto } from './dto/update-exam-report.dto';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { ChekcAbilities } from 'src/core/decorators/abilities.decorator';
import { Action } from 'src/core/types/global.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Exam Reports')
@Controller('exam-reports')
export class ExamReportsController {
  constructor(private readonly examReportsService: ExamReportsService) { }

  @Post()
  create(@Body() createExamReportDto: CreateExamReportDto) {
    return this.examReportsService.create(createExamReportDto);
  }

  @Get()
  findAll(@Query() queryDto: ExamReportQueryDto) {
    return this.examReportsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examReportsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamReportDto: UpdateExamReportDto) {
    return this.examReportsService.update(id, updateExamReportDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.examReportsService.remove(id);
  }
}
