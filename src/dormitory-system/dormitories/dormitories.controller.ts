import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DormitoriesService } from './dormitories.service';
import { CreateDormitoryDto } from './dto/create-dormitory.dto';
import { UpdateDormitoryDto } from './dto/update-dormitory.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Dormitories')
@Controller('dormitories')
export class DormitoriesController {
  constructor(private readonly dormitoriesService: DormitoriesService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  create(@Body() createDormitoryDto: CreateDormitoryDto) {
    return this.dormitoriesService.create(createDormitoryDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.dormitoriesService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.dormitoriesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateDormitoryDto: UpdateDormitoryDto) {
    return this.dormitoriesService.update(id, updateDormitoryDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN }) 
  remove(@Param('id') id: string) {
    return this.dormitoriesService.remove(id);
  }
}
