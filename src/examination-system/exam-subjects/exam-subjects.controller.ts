import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamSubjectsService } from './exam-subjects.service';
import { CreateExamSubjectDto } from './dto/create-exam-subject.dto';
import { UpdateExamSubjectDto } from './dto/update-exam-subject.dto';
import { ExamSubjectQueryDto } from './dto/exam-subject-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Exam Subjects')
@Controller('exam-subjects')
export class ExamSubjectsController {
  constructor(private readonly examSubjectsService: ExamSubjectsService) { }

  @Post()
  create(@Body() createExamSubjectDto: CreateExamSubjectDto) {
    return this.examSubjectsService.create(createExamSubjectDto);
  }

  @Get()
  findAll(@Query() queryDto: ExamSubjectQueryDto) {
    return this.examSubjectsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examSubjectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamSubjectDto: UpdateExamSubjectDto) {
    return this.examSubjectsService.update(id, updateExamSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examSubjectsService.remove(id);
  }
}
