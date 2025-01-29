import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DormitoriesService } from './dormitories.service';
import { CreateDormitoryDto } from './dto/create-dormitory.dto';
import { UpdateDormitoryDto } from './dto/update-dormitory.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Dormitories')
@Controller('dormitories')
export class DormitoriesController {
  constructor(private readonly dormitoriesService: DormitoriesService) { }

  @Post()
  @ApiOperation({ summary: 'Create Dormitory' })
  @ApiResponse({ status: 201, description: 'Dormitory created' })
  @ApiResponse({ status: 409, description: 'Dormitory with same name already exists' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createDormitoryDto: CreateDormitoryDto) {
    return this.dormitoriesService.create(createDormitoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get Dormitories' })
  @ApiResponse({ status: 200, description: 'Dormitories list' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.dormitoriesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Dormitory by id' })
  @ApiResponse({ status: 200, description: 'Dormitory details' })
  @ApiParam({ name: 'id', required: true, description: "Dormitory id" })
  @ApiResponse({ status: 404, description: 'Dormitory not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.dormitoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Dormitory by id' })
  @ApiResponse({ status: 200, description: 'Dormitory updated' })
  @ApiParam({ name: 'id', required: true, description: "Dormitory id" })
  @ApiResponse({ status: 404, description: 'Dormitory not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateDormitoryDto: UpdateDormitoryDto) {
    return this.dormitoriesService.update(id, updateDormitoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Dormitory by id' })
  @ApiParam({ name: 'id', required: true, description: "Dormitory id" })
  @ApiResponse({ status: 200, description: 'Dormitory deleted' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.dormitoriesService.remove(id);
  }
}
