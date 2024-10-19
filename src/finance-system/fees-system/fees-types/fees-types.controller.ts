import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FeesTypesService } from './fees-types.service';
import { CreateFeesTypeDto } from './dto/create-fees-type.dto';
import { UpdateFeesTypeDto } from './dto/update-fees-type.dto';
import { QueryDto } from 'src/core/dto/query.dto';
import { ChekcAbilities } from 'src/core/decorators/abilities.decorator';
import { Action } from 'src/core/types/global.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('fees-types')
@Controller('fees-types')
export class FeesTypesController {
  constructor(private readonly feesTypesService: FeesTypesService) { }

  @Post()
  create(@Body() createFeesTypeDto: CreateFeesTypeDto) {
    return this.feesTypesService.create(createFeesTypeDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.feesTypesService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeesTypeDto: UpdateFeesTypeDto) {
    return this.feesTypesService.update(id, updateFeesTypeDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.feesTypesService.remove(id);
  }
}
