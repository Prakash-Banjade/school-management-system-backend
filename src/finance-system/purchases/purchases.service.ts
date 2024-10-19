import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { Brackets, Repository } from 'typeorm';
import { DealersService } from 'src/dealers/dealers.service';
import { PurchaseQueryDto } from './dto/purchase-query.dto';
import paginatedData from 'src/core/utils/paginatedData';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase) private readonly purchaseRepo: Repository<Purchase>,
    private readonly dealersService: DealersService,
  ) { }

  async create(createPurchaseDto: CreatePurchaseDto) {
    const dealer = await this.dealersService.findOne(createPurchaseDto.dealerId);

    const newPurchase = this.purchaseRepo.create({
      ...createPurchaseDto,
      dealer
    });

    return this.purchaseRepo.save(newPurchase);
  }

  async findAll(queryDto: PurchaseQueryDto) {
    const queryBuilder = this.purchaseRepo.createQueryBuilder('purchase');

    queryBuilder
      .orderBy('purchase.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoinAndSelect('purchase.dealer', 'dealer')
      .where(new Brackets(qb => { }));

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingPurchase = await this.purchaseRepo.findOne({
      where: { id },
      relations: {
        dealer: true
      }
    })
    if (!existingPurchase) throw new NotFoundException('Purchase not found');

    return existingPurchase;
  }

  async update(id: string, updatePurchaseDto: UpdatePurchaseDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updatePurchaseDto);
    return await this.purchaseRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return await this.purchaseRepo.remove(existing);
  }
}
