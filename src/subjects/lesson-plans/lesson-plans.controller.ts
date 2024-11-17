import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LessonPlansService } from './lesson-plans.service';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LessonPlanQueryDto } from './dto/lesson-plan-query.dto';

@ApiBearerAuth()
@ApiTags('Lesson Plans')
@Controller('lesson-plans')
export class LessonPlansController {
  constructor(private readonly lessonPlansService: LessonPlansService) { }

  @Post()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE },
  )
  create(@Body() createLessonPlanDto: CreateLessonPlanDto, @CurrentUser() currentUser: AuthUser) {
    return this.lessonPlansService.create(createLessonPlanDto, currentUser);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findAll(@Query() queryDto: LessonPlanQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.lessonPlansService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.lessonPlansService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE },
  )
  update(@Param('id') id: string, @Body() updateLessonPlanDto: UpdateLessonPlanDto) {
    return this.lessonPlansService.update(id, updateLessonPlanDto);
  }

  @Delete(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE },
  )
  remove(@Param('id') id: string) {
    return this.lessonPlansService.remove(id);
  }
}
