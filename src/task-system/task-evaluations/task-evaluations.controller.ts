import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaskEvaluationsService } from './task-evaluations.service';
import { CreateTaskEvaluationDto } from './dto/create-task-evaluation.dto';
import { UpdateTaskEvaluationDto } from './dto/update-task-evaluation.dto';

@Controller('task-evaluations')
export class TaskEvaluationsController {
  constructor(private readonly taskEvaluationsService: TaskEvaluationsService) {}

  @Post()
  create(@Body() createTaskEvaluationDto: CreateTaskEvaluationDto) {
    return this.taskEvaluationsService.create(createTaskEvaluationDto);
  }

  @Get()
  findAll() {
    return this.taskEvaluationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskEvaluationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskEvaluationDto: UpdateTaskEvaluationDto) {
    return this.taskEvaluationsService.update(+id, updateTaskEvaluationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskEvaluationsService.remove(+id);
  }
}
