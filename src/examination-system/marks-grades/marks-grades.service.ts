import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMarksGradeDto } from './dto/create-marks-grade.dto';
import { UpdateMarksGradeDto } from './dto/update-marks-grade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MarksGrade } from './entities/marks-grade.entity';
import { Brackets, Not, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { markGradeSelectCols } from './helpers/mark-grade-select-cols';

@Injectable()
export class MarksGradesService {
  constructor(
    @InjectRepository(MarksGrade) private readonly marksGradeRepo: Repository<MarksGrade>,
  ) { }

  async create(createMarksGradeDto: CreateMarksGradeDto) {
    const existingWithSameNameAndScale = await this.marksGradeRepo.findOneBy({ gradeName: createMarksGradeDto.gradeName, gradeScale: createMarksGradeDto.gradeScale });
    if (existingWithSameNameAndScale) throw new ConflictException('Marks grade with same name and scale already exists');

    return this.marksGradeRepo.save(createMarksGradeDto);
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.marksGradeRepo.createQueryBuilder('marksGrade');

    queryBuilder
      .orderBy('marksGrade.gradeName', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere('LOWER(marksGrade.gradeName) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
      }))

    applySelectColumns(queryBuilder, markGradeSelectCols, 'marksGrade');

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.marksGradeRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException('Marks grade not found');

    return existing;
  }

  async update(id: string, updateMarksGradeDto: UpdateMarksGradeDto) {
    const existing = await this.findOne(id);

    // check if existing with same name and scale exists
    const name = updateMarksGradeDto.gradeName || existing.gradeName;
    const scale = updateMarksGradeDto.gradeScale || existing.gradeScale;

    const existingWithSameNameAndScale = await this.marksGradeRepo.findOneBy({ gradeName: name, gradeScale: scale, id: Not(id) });
    if (existingWithSameNameAndScale) throw new ConflictException('Marks grade with same name and scale already exists');

    Object.assign(existing, updateMarksGradeDto);
    return this.marksGradeRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return this.marksGradeRepo.remove(existing);
  }
}
