import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClassRoutinesService } from './class-routines.service';
import { CreateClassRoutineDto } from './dto/create-class-routine.dto';
import { UpdateClassRoutineDto } from './dto/update-class-routine.dto';
import { ClassRoutineQueryDto } from './dto/class-routine.query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Class Routines')
@Controller('class-routines')
export class ClassRoutinesController {
  constructor(private readonly classRoutinesService: ClassRoutinesService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createClassRoutineDto: CreateClassRoutineDto) {
    return this.classRoutinesService.create(createClassRoutineDto);
  }

  @Get()
  @CheckAbilities(
    { action: Action.READ, subject: Role.ADMIN },
    { action: Action.READ, subject: Role.STUDENT }
  )
  findAll(@Query() queryDto: ClassRoutineQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.classRoutinesService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.classRoutinesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateClassRoutineDto: UpdateClassRoutineDto) {
    return this.classRoutinesService.update(id, updateClassRoutineDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.classRoutinesService.remove(id);
  }
}
