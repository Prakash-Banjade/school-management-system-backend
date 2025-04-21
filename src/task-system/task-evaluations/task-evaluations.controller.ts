import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { TaskEvaluationsService } from './task-evaluations.service';
import { CreateTaskEvaluationDto } from './dto/create-task-evaluation.dto';
import { UpdateTaskEvaluationDto } from './dto/update-task-evaluation.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { TaskEvaluationQueryDto } from './dto/task-evaluation-query.dto';

@ApiBearerAuth()
@ApiTags("Task evaluations")
@Controller('task-evaluations')
export class TaskEvaluationsController {
  constructor(private readonly taskEvaluationsService: TaskEvaluationsService) { }

  @Post()
  @CheckAbilities({ subject: Role.TEACHER, action: Action.CREATE })
  create(@Body() dto: CreateTaskEvaluationDto, @CurrentUser() currentUser: AuthUser) {
    return this.taskEvaluationsService.create(dto, currentUser);
  }

  @Get()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findAll(@Query() queryDto: TaskEvaluationQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.taskEvaluationsService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskEvaluationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskEvaluationDto: UpdateTaskEvaluationDto) {
    return this.taskEvaluationsService.update(+id, updateTaskEvaluationDto);
  }
}
