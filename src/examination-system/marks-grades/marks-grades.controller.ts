import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MarksGradesService } from './marks-grades.service';
import { CreateMarksGradeDto } from './dto/create-marks-grade.dto';
import { UpdateMarksGradeDto } from './dto/update-marks-grade.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Marks Grades')
@Controller('marks-grades')
export class MarksGradesController {
  constructor(private readonly marksGradesService: MarksGradesService) { }

  @Post()
  create(@Body() createMarksGradeDto: CreateMarksGradeDto) {
    return this.marksGradesService.create(createMarksGradeDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.marksGradesService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marksGradesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarksGradeDto: UpdateMarksGradeDto) {
    return this.marksGradesService.update(id, updateMarksGradeDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.marksGradesService.remove(id);
  }
}
