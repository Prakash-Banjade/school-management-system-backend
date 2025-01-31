import { Controller, Get, Post, Body, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { MarksGradesService } from './marks-grades.service';
import { CreateMarksGradeDto } from './dto/create-marks-grade.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Marks Grades')
@Controller('marks-grades')
export class MarksGradesController {
  constructor(private readonly marksGradesService: MarksGradesService) { }

  @Post()
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.CREATE })
  @ApiOperation({ summary: 'Create a new marks grade' })
  @ApiResponse({ status: 201, description: 'Marks grade successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Marks grade with same name and scale already exists' })
  create(@Body() createMarksGradeDto: CreateMarksGradeDto) {
    return this.marksGradesService.create(createMarksGradeDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get a list of marks grades' })
  @ApiResponse({ status: 200, description: 'List of marks grades retrieved successfully.' })
  findAll(@Query() queryDto: QueryDto) {
    return this.marksGradesService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get details of a specific marks grade' })
  @ApiParam({ name: 'id', description: 'The ID of the marks grade' })
  @ApiResponse({ status: 200, description: 'Marks grade retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Marks grade not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.marksGradesService.findOne(id);
  }

  // @Patch(':id')
  // @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.UPDATE })
  // update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMarksGradeDto: UpdateMarksGradeDto) {
  //   return this.marksGradesService.update(id, updateMarksGradeDto);
  // }

  @Delete(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.DELETE })
  @ApiOperation({ summary: 'Delete a specific marks grade' })
  @ApiParam({ name: 'id', description: 'The ID of the marks grade to delete' })
  @ApiResponse({ status: 200, description: 'Marks grade successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Marks grade not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.marksGradesService.remove(id);
  }
}
