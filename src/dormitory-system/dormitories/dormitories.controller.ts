import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DormitoriesService } from './dormitories.service';
import { CreateDormitoryDto } from './dto/create-dormitory.dto';
import { UpdateDormitoryDto } from './dto/update-dormitory.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Dormitories')
@Controller('dormitories')
export class DormitoriesController {
  constructor(private readonly dormitoriesService: DormitoriesService) { }

  @Post()
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  create(@Body() createDormitoryDto: CreateDormitoryDto) {
    return this.dormitoriesService.create(createDormitoryDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.dormitoriesService.findAll(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.dormitoriesService.findOne(id);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateDormitoryDto: UpdateDormitoryDto) {
    return this.dormitoriesService.update(id, updateDormitoryDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' }) 
  remove(@Param('id') id: string) {
    return this.dormitoriesService.remove(id);
  }
}
