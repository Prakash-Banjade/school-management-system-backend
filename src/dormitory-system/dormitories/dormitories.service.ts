import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDormitoryDto } from './dto/create-dormitory.dto';
import { UpdateDormitoryDto } from './dto/update-dormitory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Dormitory } from './entities/dormitory.entity';
import { Brackets, ILike, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class DormitoriesService {
  constructor(
    @InjectRepository(Dormitory) private readonly dormitoryRepo: Repository<Dormitory>,
  ) { }

  async create(createDormitoryDto: CreateDormitoryDto) {
    const existing = await this.findByName(createDormitoryDto.name);
    if (existing) throw new ConflictException('Dormitory already exists');

    const newDormitory = this.dormitoryRepo.create(createDormitoryDto);
    await this.dormitoryRepo.save(newDormitory);

    return { message: 'Dormitory created successfully' };
  }

  async findAll(queryDto: QueryDto) {
    const querybuilder = this.dormitoryRepo.createQueryBuilder('dormitory');

    querybuilder
      .orderBy('dormitory.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere('LOWER(dormitory.name) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.dormitoryRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Dormitory not found');

    return existing;
  }

  async update(id: string, updateDormitoryDto: UpdateDormitoryDto) {
    const existing = await this.findOne(id);

    // check if name is taken
    if (updateDormitoryDto.name && updateDormitoryDto.name !== existing.name) {
      const existingWithSameName = await this.findByName(updateDormitoryDto.name);
      if (existingWithSameName) throw new ConflictException('Dormitory with same name already exists');
    }

    Object.assign(existing, updateDormitoryDto);

    await this.dormitoryRepo.save(existing);

    return { message: 'Dormitory updated successfully' };
  }

  async remove(id: string) {
    await this.dormitoryRepo.delete({ id });

    return { message: 'Dormitory deleted successfully' }
  }

  async findByName(name: string) {
    const foundDormitory = await this.dormitoryRepo.findOne({ where: { name: ILike(name) }, select: { id: true } });
    return foundDormitory;
  }
}
