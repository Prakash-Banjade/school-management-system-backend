import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClassRoutinesService } from './class-routines.service';
import { CreateClassRoutineDto } from './dto/create-class-routine.dto';
import { UpdateClassRoutineDto } from './dto/update-class-routine.dto';
import { ClassRoutineQueryDto } from './dto/class-routine.query.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Class Routines')
@Controller('class-routines')
export class ClassRoutinesController {
  constructor(private readonly classRoutinesService: ClassRoutinesService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @ApiOperation({ summary: 'Create a new class routine' })
  @ApiResponse({ status: 201, description: 'Class routine successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 400, description: 'Teacher does not belong to the class room branch.' })
  @ApiResponse({ status: 400, description: 'Class room does not have the subject.' })
  @ApiResponse({ status: 404, description: 'Class room not found.' })
  create(@Body() createClassRoutineDto: CreateClassRoutineDto) {
    return this.classRoutinesService.create(createClassRoutineDto);
  }

  @Get()
  @CheckAbilities(
    { action: Action.READ, subject: Role.ADMIN },
    { action: Action.READ, subject: Role.STUDENT },
    { action: Action.READ, subject: Role.TEACHER },
  )
  @ApiOperation({ summary: 'Get a list of class routines' })
  @ApiResponse({ status: 200, description: 'List of class routines retrieved successfully.' })
  findAll(@Query() queryDto: ClassRoutineQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.classRoutinesService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get details of a specific class routine' })
  @ApiParam({ name: 'id', description: 'The ID of the class routine' })
  @ApiResponse({ status: 200, description: 'Class routine retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Class routine not found.' })
  findOne(@Param('id') id: string) {
    return this.classRoutinesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @ApiOperation({ summary: 'Update a specific class routine' })
  @ApiParam({ name: 'id', description: 'The ID of the class routine to update' })
  @ApiResponse({ status: 200, description: 'Class routine successfully updated.' })
  @ApiResponse({ status: 404, description: 'Class routine not found.' })
  @ApiResponse({ status: 404, description: 'Teacher not found.' })
  @ApiResponse({ status: 404, description: 'Subject not found.' })
  update(@Param('id') id: string, @Body() updateClassRoutineDto: UpdateClassRoutineDto) {
    return this.classRoutinesService.update(id, updateClassRoutineDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  @ApiOperation({ summary: 'Delete a specific class routine' })
  @ApiParam({ name: 'id', description: 'The ID of the class routine to delete' })
  @ApiResponse({ status: 200, description: 'Class routine successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.classRoutinesService.remove(id);
  }
}
