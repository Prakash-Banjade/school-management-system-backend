import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { AcademicYearOptionsDto } from './dto/academic-year-options.dto';
import { FastifyReply } from 'fastify';
import { CookieKey, Cookies } from 'src/common/decorators/cookies.decorator';

@ApiBearerAuth()
@ApiTags('Academic Years')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) { }

  @Post()
  @CheckAbilities({ action: Action.CREATE, subject: Role.SUPER_ADMIN })
  @ApiOperation({ summary: 'Create a new academic year' })
  @ApiResponse({ status: 201, description: 'The academic year has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    return this.academicYearsService.create(createAcademicYearDto);
  }

  @Get()
  @CheckAbilities({ action: Action.READ, subject: Role.SUPER_ADMIN })
  @ApiOperation({ summary: 'Get a list of all academic years' })
  @ApiResponse({ status: 200, description: 'List of academic years retrieved successfully.' })
  findAll(@Query() queryDto: QueryDto, @Cookies(CookieKey.ACADEMIC_YEAR_ID) academicYearIdCookie: string | undefined) {
    return this.academicYearsService.findAll(queryDto, academicYearIdCookie);
  }

  @Get('options')
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  @ApiOperation({ summary: 'Get options for academic years' })
  @ApiResponse({ status: 200, description: 'Academic year options retrieved successfully.' })
  getOptions(@Query() queryDto: AcademicYearOptionsDto, @Cookies(CookieKey.ACADEMIC_YEAR_ID) academicYearIdCookie: string | undefined) {
    return this.academicYearsService.getOptions(queryDto, academicYearIdCookie);
  }

  @Get('active')
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  @ApiOperation({ summary: 'Get the active academic year' })
  @ApiResponse({ status: 200, description: 'Active academic year retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  getActive(@Cookies(CookieKey.ACADEMIC_YEAR_ID) academicYearIdCookie: string | undefined) {
    return this.academicYearsService.getActive(academicYearIdCookie);
  }

  @Get(':id')
  @CheckAbilities({ action: Action.READ, subject: Role.SUPER_ADMIN })
  @ApiOperation({ summary: 'Get a specific academic year by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the academic year' })
  @ApiResponse({ status: 200, description: 'The academic year has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  findOne(@Param('id') id: string) {
    return this.academicYearsService.findOne(id);
  }

  @Patch(':id/change-active')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.SUPER_ADMIN })
  @ApiOperation({ summary: 'Change the active status of an academic year' })
  @ApiParam({ name: 'id', description: 'The ID of the academic year' })
  @ApiResponse({ status: 200, description: 'The academic year active status has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  udpateActive(@Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.academicYearsService.udpateActive(id, reply);
  }

  @Patch(':id')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.SUPER_ADMIN })
  @ApiOperation({ summary: 'Update an academic year by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the academic year to update' })
  @ApiResponse({ status: 200, description: 'The academic year has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  update(@Param('id') id: string, @Body() updateAcademicYearDto: UpdateAcademicYearDto) {
    return this.academicYearsService.update(id, updateAcademicYearDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.SUPER_ADMIN })
  @ApiOperation({ summary: 'Delete an academic year by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the academic year to delete' })
  @ApiResponse({ status: 200, description: 'The academic year has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  remove(@Param('id') id: string) {
    return this.academicYearsService.remove(id);
  }
}
