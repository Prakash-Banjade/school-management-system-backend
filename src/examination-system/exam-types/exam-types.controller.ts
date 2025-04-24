import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ExamTypesService } from './exam-types.service';
import { CreateExamTypeDto } from './dto/create-exam-type.dto';
import { UpdateExamTypeDto } from './dto/update-exam-type.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Exam Types')
@Controller('exam-types')
export class ExamTypesController {
  constructor(private readonly examTypesService: ExamTypesService) { }

  @Post()
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.CREATE })
  @ApiOperation({ summary: 'Create a new exam type' })
  @ApiResponse({ status: 201, description: 'Exam type successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Exam type with same name already exists.' })
  create(@Body() createExamTypeDto: CreateExamTypeDto) {
    return this.examTypesService.create(createExamTypeDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  @ApiOperation({ summary: 'Get all exam types' })
  @ApiResponse({ status: 200, description: 'List of exam types retrieved successfully.' })
  findAll(@Query() queryDto: QueryDto) {
    return this.examTypesService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  @ApiOperation({ summary: 'Get options for exam types' })
  @ApiResponse({ status: 200, description: 'Exam type options retrieved successfully.' })
  getOptions(@Query() queryDto: QueryDto) {
    return this.examTypesService.getOptions(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get a specific exam type' })
  @ApiParam({ name: 'id', description: 'Exam type ID to retrieve' })
  @ApiResponse({ status: 200, description: 'Exam type retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Exam type not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examTypesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.UPDATE })
  @ApiOperation({ summary: 'Update an existing exam type' })
  @ApiParam({ name: 'id', description: 'Exam type ID to update' })
  @ApiResponse({ status: 200, description: 'Exam type updated successfully.' })
  @ApiResponse({ status: 404, description: 'Exam type not found.' })
  @ApiResponse({ status: 409, description: 'Exam type with same name already exists.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateExamTypeDto: UpdateExamTypeDto) {
    return this.examTypesService.update(id, updateExamTypeDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.DELETE })
  @ApiOperation({ summary: 'Delete a specific exam type' })
  @ApiParam({ name: 'id', description: 'Exam type ID to delete' })
  @ApiResponse({ status: 200, description: 'Exam type successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Exam type not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examTypesService.remove(id);
  }
}
