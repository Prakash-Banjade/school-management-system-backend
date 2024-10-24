import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeacherQueryDto } from './dto/teacher-query.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Teachers')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @ChekcAbilities({subject: 'all', action: Action.CREATE})
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateTeacherDto)
  @ChekcAbilities({subject: 'all', action: Action.READ})
  findAll(@Query() queryDto: TeacherQueryDto) {
    return this.teachersService.findAll(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({subject: 'all', action: Action.READ})
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(TransactionInterceptor)
  @ChekcAbilities({subject: 'all', action: Action.UPDATE})
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @ChekcAbilities({subject: 'all', action: Action.DELETE})
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
