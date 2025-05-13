import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TaskSubmissionsService } from './task-submissions.service';
import { CreateTaskSubmissionDto } from './dto/create-task-submission.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { TaskSubmissionQueryDto } from './dto/task-submission-query.dto';
import { TaskSubmissionsStudentViewService } from './task-submissions.student-view.service';
import { isStudent } from 'src/utils/utils';

@ApiBearerAuth()
@ApiTags('Task Submissions')
@Controller('task-submissions')
export class TaskSubmissionsController {
  constructor(
    private readonly taskSubmissionsService: TaskSubmissionsService,
    private readonly taskSubmissionsStudentViewService: TaskSubmissionsStudentViewService,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.STUDENT, action: Action.CREATE })
  create(@Body() createTaskSubmissionDto: CreateTaskSubmissionDto, @CurrentUser() currentUser: AuthUser) {
    return this.taskSubmissionsService.create(createTaskSubmissionDto, currentUser);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findAll(@Query() queryDto: TaskSubmissionQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.taskSubmissionsStudentViewService.findAll(queryDto, currentUser)
      : this.taskSubmissionsService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.taskSubmissionsService.findOne(id);
  }
}
