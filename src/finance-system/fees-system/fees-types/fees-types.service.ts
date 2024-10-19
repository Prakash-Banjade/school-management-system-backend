import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFeesTypeDto } from './dto/create-fees-type.dto';
import { UpdateFeesTypeDto } from './dto/update-fees-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FeesType } from './entities/fees-type.entity';
import { Brackets, ILike, Repository } from 'typeorm';
import { QueryDto } from 'src/core/dto/query.dto';
import paginatedData from 'src/core/utils/paginatedData';
import { FeesGroupsService } from '../fees-groups/fees-groups.service';

@Injectable()
export class FeesTypesService {
  constructor(
    @InjectRepository(FeesType) private readonly feesTypeRepo: Repository<FeesType>,
    private readonly feesGroupService: FeesGroupsService,
  ) { }

  async create(createFeesTypeDto: CreateFeesTypeDto) {
    await this.checkIfFeesTypeExist(createFeesTypeDto.name);

    const feesGroup = await this.feesGroupService.findOne(createFeesTypeDto.feeGroupId);

    const feesType = this.feesTypeRepo.create({
      ...createFeesTypeDto,
      feesGroup,
    });
    const savedFeesType = await this.feesTypeRepo.save(feesType);

    return this.feeTypeMutationReturn(savedFeesType, 'create');
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.feesTypeRepo.createQueryBuilder('feesType');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy('feesType.createdAt', 'DESC')
      .leftJoinAndSelect('feesType.feesGroup', 'feesGroup')
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere({ name: ILike(`%${queryDto.search}%`) })
      }));

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.feesTypeRepo.findOne({
      where: { id },
      relations: {
        feesGroup: true,
      }
    });
    if (!existing) throw new BadRequestException('Fees type not found');

    return existing;
  }

  async update(id: string, updateFeesTypeDto: UpdateFeesTypeDto) {
    const existing = await this.findOne(id);
    existing.name !== updateFeesTypeDto.name && await this.checkIfFeesTypeExist(updateFeesTypeDto.name);

    Object.assign(existing, updateFeesTypeDto);

    const savedFeesType = await this.feesTypeRepo.save(existing);

    return this.feeTypeMutationReturn(savedFeesType, 'update');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const deletedFeesType = await this.feesTypeRepo.remove(existing);

    return this.feeTypeMutationReturn(deletedFeesType, 'delete');
  }

  async checkIfFeesTypeExist(name: string) {
    const existing = await this.feesTypeRepo.findOne({ where: { name } });
    if (existing) throw new BadRequestException('Fees type already exist');
  }

  private feeTypeMutationReturn(feesType: FeesType, type: 'create' | 'update' | 'delete') {
    return {
      message: `${type === 'create' ? 'Created' : type === 'update' ? 'Updated' : 'Deleted'} fees type`,
      feeType: {
        id: feesType.id,
        name: feesType.name,
        amount: feesType.amount,
        feeGroup: {
          id: feesType.feesGroup.id,
          name: feesType.feesGroup.name,
          appliedTo: feesType.feesGroup.appliedTo,
        }
      }
    }
  }
}
