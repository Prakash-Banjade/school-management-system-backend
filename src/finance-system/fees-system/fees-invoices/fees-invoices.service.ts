import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateFeesInvoiceDto } from './dto/create-fees-invoice.dto';
import { UpdateFeesInvoiceDto } from './dto/update-fees-invoice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FeesInvoice } from './entities/fees-invoice.entity';
import { Brackets, DataSource, Repository } from 'typeorm';
import { StudentsService } from 'src/students/students.service';
import { FeeItemsService } from './fee-items.service';
import { QueryDto } from 'src/core/dto/query.dto';
import paginatedData from 'src/core/utils/paginatedData';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseRepository } from 'src/core/repository/base.repository';

@Injectable({ scope: Scope.REQUEST })
export class FeesInvoicesService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: Request,
    @InjectRepository(FeesInvoice) private readonly feesInvoiceRepo: Repository<FeesInvoice>,
    private readonly studentService: StudentsService,
    private readonly feeItemsService: FeeItemsService,
  ) {
    super(dataSource, req);
  }

  async create(createFeesInvoiceDto: CreateFeesInvoiceDto) {
    const student = await this.studentService.findOne(createFeesInvoiceDto.studentId)

    const newFeeInvoice = this.feesInvoiceRepo.create({
      ...createFeesInvoiceDto,
      student,
    })

    const savedInvoice = await this.getRepository<FeesInvoice>(FeesInvoice).save(newFeeInvoice)

    // create fee-invoice-items
    for (const feeItem of createFeesInvoiceDto.feeItems) {
      await this.feeItemsService.create({
        ...feeItem,
        feeInvoiceId: savedInvoice.id,
      }, savedInvoice)
    }

    return {
      message: 'Fees invoice created successfully',
      feesInvoice: {
        id: savedInvoice.id,
        paymentMethod: savedInvoice.paymentMethod,
        paymentStatus: savedInvoice.paymentStatus,
      }
    }
  }

  async findAll(queryDto: QueryDto) {
    const querybuilder = this.feesInvoiceRepo.createQueryBuilder('feesInvoice')

    querybuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy('feesInvoice.createdAt', 'DESC')
      .where(new Brackets(qb => {

      }))

    return paginatedData(queryDto, querybuilder)
  }

  async findOne(id: string) {
    const existing = await this.feesInvoiceRepo.findOne({
      where: { id },
      relations: {
        feeItems: true,
        student: true,
      },
      select: {
        student: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    })

    if (!existing) throw new NotFoundException('Fees invoice not found')
    return existing
  }

  async update(id: string, updateFeesInvoiceDto: UpdateFeesInvoiceDto) {
    const existing = await this.findOne(id)

    Object.assign(existing, updateFeesInvoiceDto)

    return await this.feesInvoiceRepo.save(existing)
  }

  async remove(id: string) {
    const existing = await this.findOne(id)

    return await this.feesInvoiceRepo.remove(existing)
  }
}
