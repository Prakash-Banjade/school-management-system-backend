import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LessonPlansService } from './lesson-plans.service';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto, UpdateLessonPlanStatusDto } from './dto/update-lesson-plan.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LessonPlanQueryDto } from './dto/lesson-plan-query.dto';
import { BranchId } from 'src/common/decorators/branchId.decorator';

@ApiBearerAuth()
@ApiTags('Lesson Plans')
@Controller('lesson-plans')
export class LessonPlansController {
  constructor(private readonly lessonPlansService: LessonPlansService) { }

  @Post()
  @CheckAbilities({ subject: Role.TEACHER, action: Action.CREATE })
  create(@Body() createLessonPlanDto: CreateLessonPlanDto, @CurrentUser() currentUser: AuthUser) {
    return this.lessonPlansService.create(createLessonPlanDto, currentUser);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findAll(@Query() queryDto: LessonPlanQueryDto, @CurrentUser() currentUser: AuthUser, @BranchId() branchId: string | undefined) {
    return this.lessonPlansService.findAll(queryDto, currentUser, branchId);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.lessonPlansService.findOne(id, currentUser);
  }

  @Patch(':id/change-status')
  @CheckAbilities({ subject: Role.TEACHER, action: Action.CREATE })
  updateStatus(@Param('id') id: string, @Body() updateLessonPlanDto: UpdateLessonPlanStatusDto, @CurrentUser() currentUser: AuthUser) {
    return this.lessonPlansService.updateStatus(id, updateLessonPlanDto, currentUser);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.TEACHER, action: Action.CREATE })
  update(@Param('id') id: string, @Body() updateLessonPlanDto: UpdateLessonPlanDto, @CurrentUser() currentUser: AuthUser) {
    return this.lessonPlansService.update(id, updateLessonPlanDto, currentUser);
  }

  @Delete(':id')
  @CheckAbilities(
    { subject: Role.TEACHER, action: Action.CREATE },
    { subject: Role.ADMIN, action: Action.CREATE }
  )
  remove(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.lessonPlansService.remove(id, currentUser);
  }
}
