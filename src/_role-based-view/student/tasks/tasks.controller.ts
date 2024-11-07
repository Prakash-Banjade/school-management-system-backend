import { Controller, Get, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { TaskQueryDto } from 'src/task-system/tasks/dto/task-query.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Controller('student/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Get()
  @ChekcAbilities({ subject: Role.STUDENT, action: Action.READ })
  findAll(@Query() queryDto: TaskQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.tasksService.findAll(queryDto, currentUser);
  }
}
