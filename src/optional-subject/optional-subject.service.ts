import { Inject, Injectable } from '@nestjs/common';
import { CreateOptionalSubjectDto } from './dto/create-optional-subject.dto';
import { UpdateOptionalSubjectDto } from './dto/update-optional-subject.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { Subject } from 'rxjs';
import { OptionalSubject } from './entities/optional-subject.entity';

@Injectable()
export class OptionalSubjectService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
  ) { super(datasource, req) }

  async assignStudents() {

  }

  findAll() {
    return this.getRepository(OptionalSubject).find({
      relations: ['subject', 'classRoom'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} optionalSubject`;
  }

  update(id: number, updateOptionalSubjectDto: UpdateOptionalSubjectDto) {
    return `This action updates a #${id} optionalSubject`;
  }

  remove(id: number) {
    return `This action removes a #${id} optionalSubject`;
  }
}
