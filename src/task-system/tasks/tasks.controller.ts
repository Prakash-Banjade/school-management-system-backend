import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { TaskQueryDto } from './dto/task-query.dto';
import { isStudent } from 'src/utils/isStudent';
import { TaskStudentViewService } from './task.student-view.service';

@ApiBearerAuth()
@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskStudentViewService: TaskStudentViewService
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() currentUser: AuthUser) {
    return this.tasksService.create(createTaskDto, currentUser);
  }

  @Get()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findAll(@Query() queryDto: TaskQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.taskStudentViewService.findAll(queryDto, currentUser)
      : this.tasksService.findAll(queryDto);
  }

  @Get(':id/statistics')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getStatistics(@Param('id') id: string) {
    return this.tasksService.getStatistics(id);
  }

  @Get(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.taskStudentViewService.findOne(id, currentUser)
      : this.tasksService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
