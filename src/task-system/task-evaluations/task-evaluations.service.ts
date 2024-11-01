import { Inject, Injectable } from '@nestjs/common';
import { CreateTaskEvaluationDto } from './dto/create-task-evaluation.dto';
import { UpdateTaskEvaluationDto } from './dto/update-task-evaluation.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

@Injectable()
export class TaskEvaluationsService extends BaseRepository {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private req: FastifyRequest,
  ) {
    super(dataSource, req);
  }

  create(createTaskEvaluationDto: CreateTaskEvaluationDto) {
    return 'This action adds a new taskEvaluation';
  }

  findAll() {
    return `This action returns all taskEvaluations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} taskEvaluation`;
  }

  update(id: number, updateTaskEvaluationDto: UpdateTaskEvaluationDto) {
    return `This action updates a #${id} taskEvaluation`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskEvaluation`;
  }
}
