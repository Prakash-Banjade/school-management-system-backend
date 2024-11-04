import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';
import { AcademicYearOptionsDto } from './dto/academic-year-options.dto';

@ApiBearerAuth()
@ApiTags('Academic Years')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) { }

  @Post()
  @ChekcAbilities({ action: Action.CREATE, subject: 'all' })
  create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    return this.academicYearsService.create(createAcademicYearDto);
  }

  @Get()
  @ChekcAbilities({ action: Action.READ, subject: 'all' })
  findAll(@Query() queryDto: QueryDto) {
    return this.academicYearsService.findAll(queryDto);
  }

  @Get('options')
  @ChekcAbilities({ action: Action.READ, subject: 'all' })
  getOptions(@Query() queryDto: AcademicYearOptionsDto) {
    return this.academicYearsService.getOptions(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ action: Action.READ, subject: 'all' })
  findOne(@Param('id') id: string) {
    return this.academicYearsService.findOne(id);
  }

  @Patch(':id/change-active')
  @ChekcAbilities({ action: Action.UPDATE, subject: 'all' })
  udpateActive(@Param('id') id: string) {
    return this.academicYearsService.udpateActive(id);
  }

  @Patch(':id')
  @ChekcAbilities({ action: Action.UPDATE, subject: 'all' })
  update(@Param('id') id: string, @Body() updateAcademicYearDto: UpdateAcademicYearDto) {
    return this.academicYearsService.update(id, updateAcademicYearDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.academicYearsService.remove(id);
  }
}
