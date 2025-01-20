import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FacultiesQueryDto, FacultyOptionsQueryDto } from './dto/faculties-query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { FacultiesHelper } from './helper/faculties.helper';

@ApiBearerAuth()
@ApiTags('Faculties')
@Controller('faculties')
export class FacultiesController {
  constructor(
    private readonly facultiesService: FacultiesService,
    private readonly facultiesHelper: FacultiesHelper,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.CREATE })
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultiesService.create(createFacultyDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  findAll(@Query() queryDto: FacultiesQueryDto) {
    return this.facultiesService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities(
    { subject: Role.SUPER_ADMIN, action: Action.READ },
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
  )
  getOptions(@Query() queryDto: FacultyOptionsQueryDto, @CurrentUser() currentUser: AuthUser) {
    return currentUser.role === Role.TEACHER
      ? this.facultiesHelper.getOptionsForTeacher(queryDto)
      : this.facultiesService.getOptions(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.facultiesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultiesService.update(id, updateFacultyDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.facultiesService.remove(id);
  }
}
