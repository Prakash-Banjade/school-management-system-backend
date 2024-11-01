import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser } from 'src/common/types/global.type';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { TaskQueryDto } from './dto/task-query.dto';

@ApiBearerAuth()
@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() currentUser: AuthUser) {
    return this.tasksService.create(createTaskDto, currentUser);
  }

  @Get()
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: TaskQueryDto) {
    return this.tasksService.findAll(queryDto);
  }

  @Get(':id/statistics')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  getStatistics(@Param('id') id: string) {
    return this.tasksService.getStatistics(id);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
