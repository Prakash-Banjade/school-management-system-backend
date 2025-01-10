import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Faculty } from './entities/faculty.entity';
import { Brackets, Repository } from 'typeorm';
import { FacultiesQueryDto } from './dto/faculties-query.dto';
import { paginatedRawData } from 'src/utils/paginatedData';

@Injectable()
export class FacultiesService {
  constructor(
    @InjectRepository(Faculty) private readonly facultiesRepo: Repository<Faculty>,
  ) { }

  async create(createFacultyDto: CreateFacultyDto) {
    const existingWithSameName = await this.facultiesRepo.findOne({ where: { name: createFacultyDto.name }, select: { id: true } });
    if (existingWithSameName) throw new ConflictException('Faculty with same name already exists');

    const newFaculty = this.facultiesRepo.create(createFacultyDto);

    await this.facultiesRepo.save(newFaculty);

    return { message: 'Faculty added' }
  }

  findAll(queryDto: FacultiesQueryDto) {
    const queryBuilder = this.facultiesRepo.createQueryBuilder('faculty');

    queryBuilder
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .orderBy('faculty.createdAt', queryDto.order)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(faculty.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
        queryDto.degreeLevels?.length && qb.andWhere('faculty.degreeLevel IN (:degreeLevels)', { degreeLevels: queryDto.degreeLevels });
      }))
      .select([
        'faculty.id as id',
        'faculty.name as name',
        'faculty.degreeLevel as degreeLevel',
        'faculty.duration as duration'
      ]);

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.facultiesRepo.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        degreeLevel: true,
        duration: true,
        description: true
      }
    });

    if (!existing) throw new NotFoundException('Faculty not found');

    return existing;
  }

  async update(id: string, updateFacultyDto: UpdateFacultyDto) {
    const existing = await this.findOne(id)

    if (updateFacultyDto.name && updateFacultyDto.name !== existing.name) {
      const existingWithSameName = await this.facultiesRepo.findOne({ where: { name: updateFacultyDto.name }, select: { id: true } });
      if (existingWithSameName) throw new ConflictException('Faculty with same name already exists');
    }

    await this.facultiesRepo.update({ id }, updateFacultyDto);

    return { message: 'Faculty updated' }
  }

  async remove(id: string) {
    await this.facultiesRepo.delete({ id });

    return { message: 'Faculty deleted' }
  }
}
