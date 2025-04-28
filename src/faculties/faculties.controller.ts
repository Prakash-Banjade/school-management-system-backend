import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FacultyOptionsQueryDto } from './dto/faculties-query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { FacultiesHelper } from './helper/faculties.helper';
import { QueryDto } from 'src/common/dto/query.dto';

@ApiBearerAuth()
@ApiTags('Faculties')
@Controller('faculties')
export class FacultiesController {
  constructor(
    private readonly facultiesService: FacultiesService,
    private readonly facultiesHelper: FacultiesHelper,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.CREATE })
  @ApiOperation({ summary: 'Create a new faculty' })
  @ApiResponse({ status: 201, description: 'The faculty has been successfully created.' })
  @ApiResponse({ status: 201, description: 'The faculty has been successfully created.' })
  @ApiResponse({ status: 409, description: 'Faculty with same name already exists.' })
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultiesService.create(createFacultyDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get a list of faculties' })
  @ApiResponse({ status: 200, description: 'List of faculties retrieved successfully.' })
  findAll(@Query() queryDto: QueryDto) {
    return this.facultiesService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
  )
  @ApiOperation({ summary: 'Get options for faculties' })
  @ApiResponse({ status: 200, description: 'Faculty options retrieved successfully.' })
  getOptions(@Query() queryDto: FacultyOptionsQueryDto, @CurrentUser() currentUser: AuthUser) {
    return currentUser.role === Role.TEACHER
      ? this.facultiesHelper.getOptionsForTeacher(queryDto)
      : this.facultiesService.getOptions(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get a specific faculty by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the faculty' })
  @ApiResponse({ status: 200, description: 'The faculty has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Faculty not found.' })
  findOne(@Param('id') id: string) {
    return this.facultiesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.UPDATE })
  @ApiOperation({ summary: 'Update a specific faculty by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the faculty to update' })
  @ApiResponse({ status: 200, description: 'The faculty has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Faculty not found.' })
  @ApiResponse({ status: 409, description: 'Faculty with same name already exists.' })
  update(@Param('id') id: string, @Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultiesService.update(id, updateFacultyDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.DELETE })
  @ApiOperation({ summary: 'Delete a specific faculty by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the faculty to delete' })
  @ApiResponse({ status: 200, description: 'The faculty has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Cannot delete faculty because it has class rooms. Please delete the class rooms first.' })
  remove(@Param('id') id: string) {
    return this.facultiesService.remove(id);
  }
}
