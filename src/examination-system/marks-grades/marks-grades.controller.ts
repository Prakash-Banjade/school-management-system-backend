import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
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
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  create(@Body() createMarksGradeDto: CreateMarksGradeDto) {
    return this.marksGradesService.create(createMarksGradeDto);
  }

  @Get()
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.marksGradesService.findAll(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.marksGradesService.findOne(id);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMarksGradeDto: UpdateMarksGradeDto) {
    return this.marksGradesService.update(id, updateMarksGradeDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.marksGradesService.remove(id);
  }
}
