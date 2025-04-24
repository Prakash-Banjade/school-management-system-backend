import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectOptionsQueryDto, SubjectQueryDto } from './dto/subject-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { isStudent } from 'src/utils/utils';

@ApiBearerAuth()
@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  @ApiPaginatedResponse(SubjectQueryDto)
  findAll(@Query() queryDto: SubjectQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.subjectsService.findAllByStudent(queryDto, currentUser)
      : this.subjectsService.findAll(queryDto, currentUser);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: SubjectOptionsQueryDto) {
    return this.subjectsService.getOptions(queryDto);
  }

  @Get(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
