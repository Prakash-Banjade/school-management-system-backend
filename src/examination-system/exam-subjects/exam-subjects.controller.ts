import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamSubjectsService } from './exam-subjects.service';
import { CreateExamSubjectDto } from './dto/create-exam-subject.dto';
import { UpdateExamSubjectDto } from './dto/update-exam-subject.dto';
import { ExamSubjectQueryDto } from './dto/exam-subject-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Exam Subjects')
@Controller('exam-subjects')
export class ExamSubjectsController {
  constructor(private readonly examSubjectsService: ExamSubjectsService) { }

  @Post()
  @CheckAbilities({ action: Action.CREATE, subject: Role.ADMIN })
  create(@Body() createExamSubjectDto: CreateExamSubjectDto) {
    return this.examSubjectsService.create(createExamSubjectDto);
  }

  @Get()
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findAll(@Query() queryDto: ExamSubjectQueryDto) {
    return this.examSubjectsService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  getOptions(@Query() queryDto: ExamSubjectQueryDto) {
    return this.examSubjectsService.findAll({ ...queryDto, asOptions: true } as ExamSubjectQueryDto);
  }

  @Get(':id')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findOne(@Param('id') id: string) {
    return this.examSubjectsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  update(@Param('id') id: string, @Body() updateExamSubjectDto: UpdateExamSubjectDto) {
    return this.examSubjectsService.update(id, updateExamSubjectDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.examSubjectsService.remove(id);
  }
}
