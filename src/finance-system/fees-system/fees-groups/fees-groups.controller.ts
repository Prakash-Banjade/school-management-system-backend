import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FeesGroupsService } from './fees-groups.service';
import { CreateFeesGroupDto } from './dto/create-fees-group.dto';
import { UpdateFeesGroupDto } from './dto/update-fees-group.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('fees-groups')
@Controller('fees-groups')
export class FeesGroupsController {
  constructor(private readonly feesGroupsService: FeesGroupsService) { }

  @Post()
  create(@Body() createFeesGroupDto: CreateFeesGroupDto) {
    return this.feesGroupsService.create(createFeesGroupDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.feesGroupsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesGroupsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeesGroupDto: UpdateFeesGroupDto) {
    return this.feesGroupsService.update(id, updateFeesGroupDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.feesGroupsService.remove(id);
  }
}
