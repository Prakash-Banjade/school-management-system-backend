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
    const existingWithSameNameAndScale = await this.marksGradeRepo.findOne({
      where: { gradeName: createMarksGradeDto.gradeName, gradeScale: createMarksGradeDto.gradeScale },
      select: { id: true }
    });
    if (existingWithSameNameAndScale) throw new ConflictException('Marks grade with same name and scale already exists');

    await this.marksGradeRepo.save(createMarksGradeDto);

    return {
      message: 'Marks grade created',
    }
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.marksGradeRepo.createQueryBuilder('marksGrade');

    queryBuilder
      .orderBy('marksGrade.percentTo', queryDto.order)
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
    await this.marksGradeRepo.save(existing);

    return {
      message: 'Marks grade updated',
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.marksGradeRepo.remove(existing);

    return {
      message: 'Marks grade deleted',
    }
  }
}
