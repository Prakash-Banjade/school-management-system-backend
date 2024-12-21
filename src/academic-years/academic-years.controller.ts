import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { AcademicYearOptionsDto } from './dto/academic-year-options.dto';

@ApiBearerAuth()
@ApiTags('Academic Years')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) { }

  @Post()
  @CheckAbilities({ action: Action.CREATE, subject: Role.ADMIN })
  create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    return this.academicYearsService.create(createAcademicYearDto);
  }

  @Get()
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findAll(@Query() queryDto: QueryDto) {
    return this.academicYearsService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  getOptions(@Query() queryDto: AcademicYearOptionsDto) {
    return this.academicYearsService.getOptions(queryDto);
  }

  @Get('active')
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  getActive() {
    return this.academicYearsService.getActive();
  }

  @Get(':id')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findOne(@Param('id') id: string) {
    return this.academicYearsService.findOne(id);
  }

  @Patch(':id/change-active')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  udpateActive(@Param('id') id: string) {
    return this.academicYearsService.udpateActive(id);
  }

  @Patch(':id')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  update(@Param('id') id: string, @Body() updateAcademicYearDto: UpdateAcademicYearDto) {
    return this.academicYearsService.update(id, updateAcademicYearDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.academicYearsService.remove(id);
  }
}
