import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaskSubmissionsService } from './task-submissions.service';
import { CreateTaskSubmissionDto } from './dto/create-task-submission.dto';
import { UpdateTaskSubmissionDto } from './dto/update-task-submission.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { ApiTags } from '@nestjs/swagger';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';

@ApiTags('Task Submissions')
@Controller('task-submissions')
export class TaskSubmissionsController {
  constructor(private readonly taskSubmissionsService: TaskSubmissionsService) { }

  @Post()
  @ChekcAbilities({ subject: Role.STUDENT, action: Action.CREATE })
  create(@Body() createTaskSubmissionDto: CreateTaskSubmissionDto, @CurrentUser() user: AuthUser) {
    return this.taskSubmissionsService.create(createTaskSubmissionDto);
  }

  @Get()
  findAll() {
    return this.taskSubmissionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskSubmissionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskSubmissionDto: UpdateTaskSubmissionDto) {
    return this.taskSubmissionsService.update(id, updateTaskSubmissionDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.taskSubmissionsService.remove(id);
  }
}
