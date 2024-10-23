import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClassRoutinesService } from './class-routines.service';
import { CreateClassRoutineDto } from './dto/create-class-routine.dto';
import { UpdateClassRoutineDto } from './dto/update-class-routine.dto';
import { ClassRoutineQueryDto } from './dto/class-routine.query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Class Routines')
@Controller('class-routines')
export class ClassRoutinesController {
  constructor(private readonly classRoutinesService: ClassRoutinesService) { }

  @Post()
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  create(@Body() createClassRoutineDto: CreateClassRoutineDto) {
    return this.classRoutinesService.create(createClassRoutineDto);
  }

  @Get()
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: ClassRoutineQueryDto) {
    return this.classRoutinesService.findAll(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.classRoutinesService.findOne(id);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateClassRoutineDto: UpdateClassRoutineDto) {
    return this.classRoutinesService.update(id, updateClassRoutineDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.classRoutinesService.remove(id);
  }
}
