import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMarksGradeDto } from './dto/create-marks-grade.dto';
import { UpdateMarksGradeDto } from './dto/update-marks-grade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MarksGrade } from './entities/marks-grade.entity';
import { Repository } from 'typeorm';
import { QueryDto } from 'src/core/dto/query.dto';
import paginatedData from 'src/core/utils/paginatedData';

@Injectable()
export class MarksGradesService {
  constructor(
    @InjectRepository(MarksGrade) private readonly marksGradeRepo: Repository<MarksGrade>,
  ) { }

  async create(createMarksGradeDto: CreateMarksGradeDto) {
    const existingWithSameName = await this.marksGradeRepo.findOneBy({ gradeName: createMarksGradeDto.gradeName });
    if (existingWithSameName) throw new ConflictException('Marks grade with same name already exists');

    const existingWithSameGpa = await this.marksGradeRepo.findOneBy({ gpa: createMarksGradeDto.gpa });
    if (existingWithSameGpa) throw new ConflictException('Marks grade with same gpa already exists');

    return this.marksGradeRepo.save(createMarksGradeDto);
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.marksGradeRepo.createQueryBuilder('marksGrade');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy('marksGrade.createdAt', 'DESC')

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.marksGradeRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException('Marks grade not found');

    return existing;
  }

  async update(id: string, updateMarksGradeDto: UpdateMarksGradeDto) {
    const existing = await this.findOne(id);

    if (updateMarksGradeDto.gradeName && updateMarksGradeDto.gradeName !== existing.gradeName) {
      const existingWithSameName = await this.marksGradeRepo.findOneBy({ gradeName: updateMarksGradeDto.gradeName });
      if (existingWithSameName && existingWithSameName.id !== id) throw new ConflictException('Marks grade with same name already exists');
    }

    if (updateMarksGradeDto.gpa && updateMarksGradeDto.gpa !== existing.gpa) {
      const existingWithSameGpa = await this.marksGradeRepo.findOneBy({ gpa: updateMarksGradeDto.gpa });
      if (existingWithSameGpa && existingWithSameGpa.id !== id) throw new ConflictException('Marks grade with same gpa already exists');
    }

    Object.assign(existing, updateMarksGradeDto);
    return this.marksGradeRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return this.marksGradeRepo.remove(existing);
  }
}
