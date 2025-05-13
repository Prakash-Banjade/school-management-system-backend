import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskStudentViewService } from './task.student-view.service';
import { isStudent } from 'src/utils/utils';
import { BranchId } from 'src/common/decorators/branchId.decorator';

@ApiBearerAuth()
@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskStudentViewService: TaskStudentViewService
  ) { }

  @Post()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE }
  )
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() currentUser: AuthUser) {
    return this.tasksService.create(createTaskDto, currentUser);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findAll(@Query() queryDto: TaskQueryDto, @CurrentUser() currentUser: AuthUser, @BranchId() branchId: string | undefined) {
    return isStudent(currentUser)
      ? this.taskStudentViewService.findAll(queryDto, currentUser)
      : this.tasksService.findAll(queryDto, currentUser, branchId);
  }

  @Get('counts')
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  getTaskCounts(@Query() queryDto: TaskQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.taskStudentViewService.getCounts(queryDto, currentUser);
  }

  @Get(':id/statistics')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  getStatistics(@Param('id') id: string) {
    return this.tasksService.getStatistics(id);
  }

  @Get(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  findOne(@Param('id') id: string, @BranchId() branchId: string | undefined) {
    return this.tasksService.findOne(id, branchId);
  }

  @Patch(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.UPDATE },
    { subject: Role.TEACHER, action: Action.UPDATE }
  )
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @CurrentUser() currentUser: AuthUser, @BranchId() branchId: string | undefined) {
    return this.tasksService.update(id, updateTaskDto, branchId, currentUser);
  }

  @Delete(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.DELETE },
    { subject: Role.TEACHER, action: Action.DELETE }
  )
  remove(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.tasksService.remove(id, currentUser);
  }
}
