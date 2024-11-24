import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { Student } from 'src/students/entities/student.entity';
import { FeeInvoice } from './entities/fee-invoice.entity';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';
import { FeeInvoiceItem } from './entities/fee-invoice-item.entity';
import { ChargeHead } from '../charge-heads/entities/charge-head.entity';
import { StudentLedger } from '../student-ledgers/entities/student-ledger.entity';
import { LedgerItem } from '../student-ledgers/entities/ledger-item.entity';

@Injectable({ scope: Scope.REQUEST })
export class FeeInvoiceService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly academicYearsService: AcademicYearsService
    ) { super(dataSource, req); }

    async create(dto: CreateFeeInvoiceDto) {
        const { isPast, latestAcademicYear } = await this.academicYearsService.isPast();
        if (isPast) throw new BadRequestException('Cannot create fee invoice for past academic year');

        const student = await this.getRepository(Student).createQueryBuilder('student')  // TODO: assuming student is of current academic year
            .leftJoin('student.enrollments', 'enrollments', 'enrollments.academicYearId = :academicYearId', { academicYearId: latestAcademicYear.id })
            .leftJoin('enrollments.ledger', 'ledger')
            .where('student.id = :studentId', { studentId: dto.studentId })
            .select([
                'student.id',
                'enrollments.id',
                'ledger.id',
                'ledger.amount',
            ]).getOne();
        if (!student) throw new NotFoundException('Student not found');

        const ledger = student.enrollments[0]?.ledger;

        if (!ledger) throw new InternalServerErrorException('Ledger associated with student not found');

        // validate month
        const pastMonthFeeInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .leftJoin('feeInvoice.studentLedger', 'studentLedger')
            .leftJoin('studentLedger.enrollment', 'enrollment')
            .where('enrollment.academicYearId = :academicYearId', { academicYearId: latestAcademicYear.id })
            .andWhere('feeInvoice.month >= :month', { month: dto.month })
            .getOne();

        if (pastMonthFeeInvoice) throw new BadRequestException('Fee invoice for this month already exists');

        // TODO: assuming all the amounts are valid and correctly calculated

        let grandTotal = 0;
        const invoiceItems = await Promise.all(dto.invoiceItems.map(async item => {
            grandTotal += this.calculateAmountAfterDiscount(item.amount, item.discount);

            const chargeHead = await this.getRepository(ChargeHead).findOne({
                where: { id: item.chargeHeadId },
                select: { id: true }
            });
            if (!chargeHead) throw new NotFoundException('Charge head not found');

            return this.getRepository(FeeInvoiceItem).create({
                amount: item.amount,
                discount: item.discount,
                chargeHead,
                remark: item.remarks,
            });
        }));

        const feeInvoice = this.getRepository(FeeInvoice).create({
            invoiceNo: await this.generateInvoiceNo(),
            month: dto.month,
            studentLedger: ledger,
            totalAmount: grandTotal,
            dueDate: dto.dueDate,
            invoiceDate: dto.invoiceDate,
            items: invoiceItems,
            ledgerItem: this.getRepository(LedgerItem).create({
                date: dto.invoiceDate,
                ledgerAmount: ledger.amount + grandTotal, // this is ths snapshot of the ledger at the time of invoice creation
                studentLedger: ledger,
            })
        });

        await this.getRepository(FeeInvoice).save(feeInvoice);

        // update ledger amount
        await this.getRepository(StudentLedger).update({ id: ledger.id }, { amount: ledger.amount + grandTotal });

        return {
            message: 'Invoice created',
            invoiceNo: feeInvoice.invoiceNo
        }
    }

    private readonly calculateAmountAfterDiscount = (amount: number, discount: number) => {
        return amount - (amount * discount / 100);
    }

    private async generateInvoiceNo() {
        const lastInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .orderBy('feeInvoice.createdAt', 'DESC')
            .limit(1)
            .select(['feeInvoice.id', 'feeInvoice.invoiceNo'])
            .getOne();

        if (!lastInvoice) {
            return `INV-${new Date().getFullYear()}-0001`
        } else {
            const invDigit = (+lastInvoice.invoiceNo.split('-').at(-1) + 1).toString().padStart(4, '0');
            return `INV-${new Date().getFullYear()}-${invDigit}`;
        }
    }
}
