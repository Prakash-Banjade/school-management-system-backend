import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { CreateFeePaymentDto } from './dto/create-fee-payment.dto';
import { FeeInvoice } from '../fee-invoice/entities/fee-invoice.entity';
import { FeePayment } from './entities/fee-payment.entity';

@Injectable({ scope: Scope.REQUEST })
export class FeePaymentsService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    ) { super(dataSource, req) }

    async create(dto: CreateFeePaymentDto) {
        const feeInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .where('feeInvoice.id = :feeInvoiceId', { feeInvoiceId: dto.feeInvoiceId })
            .leftJoin('feeInvoice.studentLedger', 'studentLedger')
            .select(['feeInvoice.id', 'studentLedger.amount'])
            .getOne();
        if (!feeInvoice) throw new NotFoundException('Fee invoice not found');

        if (dto.paidAmount > feeInvoice.studentLedger.amount) throw new NotFoundException('Payment amount cannot be greater than the previous due amount');

        console.log(feeInvoice)

        const payment = this.getRepository(FeePayment).create({
            feeInvoice,
            amount: dto.paidAmount,
            paymentMethod: dto.paymentMethod,
            remark: dto.remark,
        })
    }
}
