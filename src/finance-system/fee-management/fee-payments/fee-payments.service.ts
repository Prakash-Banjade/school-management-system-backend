import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { CreateFeePaymentDto } from './dto/create-fee-payment.dto';
import { FeeInvoice } from '../fee-invoice/entities/fee-invoice.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { LedgerItem } from '../student-ledgers/entities/ledger-item.entity';
import { format } from 'date-fns';
import { StudentLedger } from '../student-ledgers/entities/student-ledger.entity';

@Injectable({ scope: Scope.REQUEST })
export class FeePaymentsService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    ) { super(dataSource, req) }

    async create(dto: CreateFeePaymentDto) {
        const feeInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .where('feeInvoice.id = :feeInvoiceId', { feeInvoiceId: dto.feeInvoiceId })
            .leftJoin('feeInvoice.ledgerItem', 'ledgerItem')
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .select(['feeInvoice.id', 'ledgerItem.id', 'ledgerItem.ledgerAmount', 'studentLedger.id', 'studentLedger.amount'])
            .getOne();
        if (!feeInvoice || !feeInvoice.ledgerItem?.studentLedger?.id) throw new NotFoundException('Fee invoice not found');

        if (dto.paidAmount > feeInvoice.ledgerItem?.ledgerAmount) throw new NotFoundException('Payment amount cannot be greater than the previous due amount');

        // update student ledger
        feeInvoice.ledgerItem.studentLedger.updateAmount(dto.paidAmount * (-1)); // subtracting the payment amount from the student ledger
        const updatedLedger = await this.getRepository(StudentLedger).save(feeInvoice.ledgerItem.studentLedger);

        const payment = this.getRepository(FeePayment).create({
            feeInvoice,
            amount: dto.paidAmount,
            paymentMethod: dto.paymentMethod,
            remark: dto.remark,
            receiptNo: await this.generateReceiptNo(),
            ledgerItem: this.getRepository(LedgerItem).create({
                date: format(new Date(), 'yyyy-MM-dd'),
                ledgerAmount: updatedLedger.amount,
                studentLedger: feeInvoice.ledgerItem?.studentLedger,
            })
        });

        await this.getRepository(FeePayment).save(payment);

        return {
            message: 'Payment created',
            receiptNo: payment.receiptNo,
        }
    }

    private async generateReceiptNo() {
        const lastInvoice = await this.getRepository(FeePayment).createQueryBuilder('feePayment')
            .orderBy('feePayment.createdAt', 'DESC')
            .limit(1)
            .select(['feePayment.id', 'feePayment.receiptNo'])
            .getOne();

        if (!lastInvoice) {
            return `FEE-${new Date().getFullYear()}-0001`
        } else {
            const invDigit = (+lastInvoice.receiptNo.split('-').at(-1) + 1).toString().padStart(4, '0');
            return `FEE-${new Date().getFullYear()}-${invDigit}`;
        }
    }
}
