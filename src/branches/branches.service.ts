import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Brackets, DataSource, ILike } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class BranchesService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest
  ) { super(dataSource, req) }

  async create(createBranchDto: CreateBranchDto) {
    const existingWithSameName = await this.getRepository(Branch).findOne({
      where: { name: ILike(createBranchDto.name) },
      select: { id: true }
    });
    if (existingWithSameName) throw new ConflictException('Branch name already exists');

    const newBranch = this.getRepository(Branch).create({
      ...createBranchDto
    });

    await this.getRepository(Branch).save(newBranch);

    return {
      message: 'Branch created successfully',
    }
  }

  findAll(queryDto: QueryDto) {
    const querybuilder = this.getRepository(Branch).createQueryBuilder('branch')
      .take(queryDto.take)
      .skip(queryDto.skip)
      .orderBy("branch.createdAt", queryDto.order)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(branch.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select(['branch.id', 'branch.name', 'branch.description', 'branch.address']);

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(Branch).findOne({
      where: { id },
      select: { id: true, name: true, description: true, address: true }
    });

    if (!existing) throw new NotFoundException('Branch not found');

    return existing;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateBranchDto);

    await this.getRepository(Branch).save(existing);

    return {
      message: 'Branch updated successfully',
    }
  }
}
