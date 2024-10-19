import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamTypesService } from './exam-types.service';
import { CreateExamTypeDto } from './dto/create-exam-type.dto';
import { UpdateExamTypeDto } from './dto/update-exam-type.dto';
import { QueryDto } from 'src/core/dto/query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Exam Types')
@Controller('exam-types')
export class ExamTypesController {
  constructor(private readonly examTypesService: ExamTypesService) { }

  @Post()
  create(@Body() createExamTypeDto: CreateExamTypeDto) {
    return this.examTypesService.create(createExamTypeDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.examTypesService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExamTypeDto: UpdateExamTypeDto) {
    return this.examTypesService.update(id, updateExamTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examTypesService.remove(id);
  }
}
