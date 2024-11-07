import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TaskSubmissionsService } from './task-submissions.service';
import { CreateTaskSubmissionDto } from './dto/create-task-submission.dto';
import { UpdateTaskSubmissionDto } from './dto/update-task-submission.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { TaskSubmissionQueryDto } from './dto/task-submission-query.dto';

@ApiBearerAuth()
@ApiTags('Task Submissions')
@Controller('task-submissions')
export class TaskSubmissionsController {
  constructor(private readonly taskSubmissionsService: TaskSubmissionsService) { }

  @Post()
  @CheckAbilities({ subject: Role.STUDENT, action: Action.CREATE })
  create(@Body() createTaskSubmissionDto: CreateTaskSubmissionDto, @CurrentUser() currentUser: AuthUser) {
    return this.taskSubmissionsService.create(createTaskSubmissionDto, currentUser);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: TaskSubmissionQueryDto) {
    return this.taskSubmissionsService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.taskSubmissionsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.STUDENT, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateTaskSubmissionDto: UpdateTaskSubmissionDto) {
    return this.taskSubmissionsService.update(id, updateTaskSubmissionDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.taskSubmissionsService.remove(id);
  }
}
