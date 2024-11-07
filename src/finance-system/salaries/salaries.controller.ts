import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SalariesService } from './salaries.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { SalaryQueryDto } from './dto/salary-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Salaries')
@Controller('salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) { }

  @Post()
  create(@Body() createSalaryDto: CreateSalaryDto) {
    return this.salariesService.create(createSalaryDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateSalaryDto)
  findAll(@Query() queryDto: SalaryQueryDto) {
    return this.salariesService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salariesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSalaryDto: UpdateSalaryDto) {
    return this.salariesService.update(id, updateSalaryDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.salariesService.remove(id);
  }
}
