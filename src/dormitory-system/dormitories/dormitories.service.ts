import { ConflictException, Injectable } from '@nestjs/common';
import { CreateDormitoryDto } from './dto/create-dormitory.dto';
import { UpdateDormitoryDto } from './dto/update-dormitory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Dormitory } from './entities/dormitory.entity';
import { Brackets, Repository } from 'typeorm';
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
    const savedDormitory = await this.dormitoryRepo.save(newDormitory);

    return this.dormitoryMutationReturn(savedDormitory, 'created');
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
    if (!existing) throw new ConflictException('Dormitory not found');

    return existing;
  }

  async update(id: string, updateDormitoryDto: UpdateDormitoryDto) {
    const existing = await this.findOne(id);
    if (existing.name && (existing.name !== updateDormitoryDto.name)) throw new ConflictException('Dormitory name already exists');

    Object.assign(existing, updateDormitoryDto);

    const savedDormitory = await this.dormitoryRepo.save(existing);

    return this.dormitoryMutationReturn(savedDormitory, 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    const deletedDormitory = await this.dormitoryRepo.remove(existing);

    return this.dormitoryMutationReturn(deletedDormitory, 'deleted');
  }

  async findByName(name: string) {
    const foundDormitory = await this.dormitoryRepo.findOne({ where: { name } });
    return foundDormitory;
  }

  private dormitoryMutationReturn(dormitory: Dormitory, type: 'created' | 'updated' | 'deleted') {
    return {
      message: type === 'created' ? 'Dormitory created successfully' : type === 'deleted' ? 'Dormitory deleted successfully' : 'Dormitory updated successfully',
      dormitory: {
        id: dormitory.id,
        name: dormitory.name
      }
    }
  }
}
