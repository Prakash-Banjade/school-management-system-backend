import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectQueryDto } from './dto/subject-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { Action, AuthUser } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';

@ApiBearerAuth()
@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) { }

  @Post()
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  // @ChekcAbilities({ subject: 'all', action: Action.READ })
  @ApiPaginatedResponse(SubjectQueryDto)
  findAll(@Query() queryDto: SubjectQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.subjectsService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.subjectsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto, @CurrentUser() currentUser: AuthUser) {
    return this.subjectsService.update(id, updateSubjectDto, currentUser);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.subjectsService.remove(id, currentUser);
  }
}
