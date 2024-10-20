import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Brackets, Repository } from 'typeorm';
import { DealersService } from 'src/dealers/dealers.service';
import { PaymentQueryDto } from './dto/payment-query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly dealersService: DealersService,
  ) { }

  async create(createPaymentDto: CreatePaymentDto) {
    const dealer = await this.dealersService.findOne(createPaymentDto.dealerId);

    const newPayment = this.paymentRepo.create({
      ...createPaymentDto,
      dealer
    });

    return this.paymentRepo.save(newPayment);
  }

  async findAll(queryDto: PaymentQueryDto) {
    const queryBuilder = this.paymentRepo.createQueryBuilder('payment');

    queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoinAndSelect('payment.dealer', 'dealer')
      .where(new Brackets(qb => { }));

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingPayment = await this.paymentRepo.findOne({
      where: { id },
      relations: {
        dealer: true
      }
    })
    if (!existingPayment) throw new NotFoundException('Payment not found');

    return existingPayment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updatePaymentDto);
    return await this.paymentRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return await this.paymentRepo.remove(existing);
  }
}
