import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { UpdateDealerDto } from './dto/update-dealer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Dealer } from './entities/dealer.entity';
import { Brackets, Not, Repository } from 'typeorm';
import { DealerQueryDto } from './dto/dealer-query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class DealersService {
  constructor(
    @InjectRepository(Dealer) private readonly dealerRepo: Repository<Dealer>,
  ) { }

  async create(createDealerDto: CreateDealerDto) {
    await this.checkIfDealerExists(createDealerDto);

    const newDealer = this.dealerRepo.create(createDealerDto);
    const savedDealer = await this.dealerRepo.save(newDealer);

    return this.dealerMutationReturn(savedDealer, 'created');
  }

  async findAll(queryDto: DealerQueryDto) {
    const queryBuilder = this.dealerRepo.createQueryBuilder('dealer');

    queryBuilder
      .orderBy("dealer.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(dealer.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
        queryDto.contact && qb.andWhere("dealer.contact = :contact", { contact: queryDto.contact })
        queryDto.panNo && qb.andWhere("dealer.panNo = :panNo", { panNo: queryDto.panNo })
        queryDto.accountNumber && qb.andWhere("dealer.accountNumber = :accountNumber", { accountNumber: queryDto.accountNumber })
      }))

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingDealer = await this.dealerRepo.findOne({
      where: { id }
    });
    if (!existingDealer) throw new BadRequestException('Dealer not found');

    return existingDealer;
  }

  async update(id: string, updateDealerDto: UpdateDealerDto) {
    const existingDealer = await this.findOne(id);
    await this.checkIfDealerExists(updateDealerDto, existingDealer);

    const savedDealer = await this.dealerRepo.save({ ...existingDealer, ...updateDealerDto });

    return this.dealerMutationReturn(savedDealer, 'updated');
  }

  async remove(id: string) {
    const existingDealer = await this.findOne(id);

    const removedDealer = await this.dealerRepo.softRemove(existingDealer);

    return this.dealerMutationReturn(removedDealer, 'deleted');
  }

  async checkIfDealerExists(dealerDto: CreateDealerDto | UpdateDealerDto, dealer?: Dealer) {
    const { accountNumber, contact, panNo } = dealerDto;

    const existingDealer = await this.dealerRepo.createQueryBuilder('dealer')
      .where({ id: dealer?.id ? Not(dealer.id) : undefined })
      .where(new Brackets(qb => {
        qb.where([
          { contact },
          { panNo },
          { accountNumber }
        ])
      })).getOne();

    if (existingDealer && !dealer) {
      if (existingDealer.contact === contact) throw new BadRequestException('Dealer with this contact already exists');
      if (existingDealer.panNo === panNo) throw new BadRequestException('Dealer with this panNo already exists');
      if (existingDealer.accountNumber === accountNumber) throw new BadRequestException('Dealer with this accountNumber already exists');
    } else if (existingDealer && dealer) {
      if (existingDealer.contact === contact && existingDealer.id !== dealer.id) throw new BadRequestException('Dealer with this contact already exists');
      if (existingDealer.panNo === panNo && existingDealer.id !== dealer.id) throw new BadRequestException('Dealer with this panNo already exists');
      if (existingDealer.accountNumber === accountNumber && existingDealer.id !== dealer.id) throw new BadRequestException('Dealer with this accountNumber already exists');
    }
  }

  private dealerMutationReturn = (dealer: Dealer, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Dealer created successfully' : type === 'deleted' ? 'Dealer deleted successfully' : 'Dealer updated successfully',
      dealer: {
        id: dealer.id,
        name: dealer.name,
      }
    }
  }
}
