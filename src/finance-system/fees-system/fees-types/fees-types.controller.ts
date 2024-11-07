import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FeesTypesService } from './fees-types.service';
import { CreateFeesTypeDto } from './dto/create-fees-type.dto';
import { UpdateFeesTypeDto } from './dto/update-fees-type.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

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
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.feesTypesService.remove(id);
  }
}
