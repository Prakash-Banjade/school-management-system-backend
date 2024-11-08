import { ConflictException, Injectable } from '@nestjs/common';
import { CreateExamTypeDto } from './dto/create-exam-type.dto';
import { UpdateExamTypeDto } from './dto/update-exam-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExamType } from './entities/exam-type.entity';
import { Brackets, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class ExamTypesService {
  constructor(
    @InjectRepository(ExamType) private readonly examTypeRepo: Repository<ExamType>,
  ) { }

  async create(createExamTypeDto: CreateExamTypeDto) {
    const existingWitSameName = await this.examTypeRepo.findOne({
      where: { name: createExamTypeDto.name },
    })
    if (existingWitSameName) throw new ConflictException('Exam type with same name already exists')

    const newExamType = this.examTypeRepo.create(createExamTypeDto)
    await this.examTypeRepo.save(newExamType)

    return {
      message: 'Exam type added',
    }
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.examTypeRepo.createQueryBuilder('examType');

    queryBuilder
      .orderBy("examType.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(examType.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select([
        "examType.id",
        "examType.name",
        "examType.description",
        "examType.createdAt",
      ])

    return paginatedData(queryDto, queryBuilder);
  }

  async getOptions(queryDto: QueryDto) {
    return this.examTypeRepo.createQueryBuilder('examType')
      .orderBy("examType.createdAt", queryDto.order)
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(examType.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select([
        "examType.id as value",
        "examType.name as label",
      ])
      .getRawMany();
  }
  
  async findOne(id: string) {
    const existing = await this.examTypeRepo.findOne({
      where: { id },
    })

    if (!existing) throw new ConflictException('Exam type not found')

    return existing
  }

  async update(id: string, updateExamTypeDto: UpdateExamTypeDto) {
    const existing = await this.findOne(id);

    // check if name is taken
    if (updateExamTypeDto.name && updateExamTypeDto.name !== existing.name) {
      const existingWithName = await this.examTypeRepo.findOneBy({ name: updateExamTypeDto.name });
      if (existingWithName) throw new ConflictException('Exam type with same name already exists');
    }

    // update the exam type
    Object.assign(existing, updateExamTypeDto);
    await this.examTypeRepo.save(existing);

    return {
      message: 'Exam type updated'
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.examTypeRepo.remove(existing);

    return {
      message: 'Exam type removed',
    }
  }
}
