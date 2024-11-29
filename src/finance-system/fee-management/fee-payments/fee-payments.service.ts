import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource, In } from 'typeorm';
import { CreateFeePaymentDto, LibraryFinePaymentDto } from './dto/create-fee-payment.dto';
import { FeeInvoice } from '../fee-invoice/entities/fee-invoice.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { ELedgerItemType, LedgerItem } from '../student-ledgers/entities/ledger-item.entity';
import { format } from 'date-fns';
import { StudentLedger } from '../student-ledgers/entities/student-ledger.entity';
import { BookTransactionsHelper } from 'src/library-system/book-transactions/helpers/book-transactinos.helper';
import { ChargeHead } from '../charge-heads/entities/charge-head.entity';
import { CHARGE_HEADS } from 'src/common/CONSTANTS';
import { FeeInvoiceItem } from '../fee-invoice/entities/fee-invoice-item.entity';
import { Student } from 'src/students/entities/student.entity';
import { FeeInvoiceService } from '../fee-invoice/fee-invoice.service';
import { EMonth } from 'src/common/types/months';
import { UnpaidTransactionsQueryDto } from 'src/library-system/book-transactions/dto/book-transactions-query.dto';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';
import { BookTransaction } from 'src/library-system/book-transactions/entities/book-transaction.entity';

@Injectable({ scope: Scope.REQUEST })
export class FeePaymentsService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly bookTransactionsHelper: BookTransactionsHelper,
        private readonly feeInvoiceService: FeeInvoiceService,
        private readonly academicYearsService: AcademicYearsService
    ) { super(dataSource, req) }

    async create(dto: CreateFeePaymentDto) {
        const { isPast } = await this.academicYearsService.isPast();
        if (isPast) throw new BadRequestException('Cannot create fee payment from past academic year');

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
                type: ELedgerItemType.Payment,
                remark: dto.remark || 'Monthly Fee payment',
            })
        });

        await this.getRepository(FeePayment).save(payment);

        return {
            message: 'Payment created',
            receiptNo: payment.receiptNo,
        }
    }

    private async generateReceiptNo(prefix: 'FEE' | 'FINE' = 'FEE') {
        const lastInvoice = await this.getRepository(FeePayment).createQueryBuilder('feePayment')
            .where('feePayment.receiptNo LIKE :prefix', { prefix: `${prefix}-%` })
            .orderBy('feePayment.createdAt', 'DESC')
            .limit(1)
            .select(['feePayment.id', 'feePayment.receiptNo'])
            .getOne();

        if (!lastInvoice) {
            return `${prefix}-${new Date().getFullYear()}-00001`
        } else {
            const invDigit = (+lastInvoice.receiptNo.split('-').at(-1) + 1).toString().padStart(5, '0');
            return `${prefix}-${new Date().getFullYear()}-${invDigit}`;
        }
    }

    async findOne(id: string) {
        const queryBuilder = this.getRepository(FeePayment).createQueryBuilder('feePayment')
            .leftJoin('feePayment.ledgerItem', 'paymentLedgerItem')
            .leftJoin('feePayment.feeInvoice', 'feeInvoice')
            .leftJoin('feeInvoice.ledgerItem', 'ledgerItem')
            .leftJoin('feeInvoice.feePayments', 'priorFeePayments', 'priorFeePayments.createdAt < feePayment.createdAt') // used to calculate how much amount is paid before for this fee invoice
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .leftJoin('studentLedger.enrollment', 'enrollment')
            .leftJoin('enrollment.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('enrollment.student', 'student')
            .leftJoin('feeInvoice.items', 'items')
            .leftJoin('items.chargeHead', 'chargeHead')
            .where('feePayment.id = :id', { id })
            .select([
                'feePayment.id',
                'feePayment.receiptNo',
                'feePayment.amount',
                'feePayment.paymentMethod',
                'feePayment.remark',
                'feePayment.createdAt',
                'paymentLedgerItem.id',
                'paymentLedgerItem.type',
                'feeInvoice.id',
                'feeInvoice.month',
                'feeInvoice.totalAmount',
                'ledgerItem.id',
                'ledgerItem.type',
                'ledgerItem.ledgerAmount',
                'items.id',
                'items.amount',
                'items.discount',
                'items.remark',
                'chargeHead.id',
                'chargeHead.name',
            ])
            .addSelect('SUM(priorFeePayments.amount)', 'totalFeesPaid')
            .addSelect(`
                JSON_OBJECT(
                    "id", student.id,
                    "studentId", student.studentId,
                    "name", CONCAT(student.firstName, " ", student.lastName),
                    "email", student.email,
                    "phone", student.phone,
                    "rollNo", enrollment.rollNo,
                    "classRoomName", CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, " - ", classRoom.name) END
                )`, 'student'
            )
            .groupBy('feeInvoice.id')
            .addGroupBy('items.id')

        const payment = await queryBuilder.getOne();

        const rawPayment = await queryBuilder.getRawOne();

        if (!payment) throw new NotFoundException('Payment not found');

        // also send book transactions if payment is for library fine
        const bookTransactions = (payment.ledgerItem?.type === ELedgerItemType.LibraryFine) ?
            await this.getRepository(BookTransaction).createQueryBuilder('bookTransaction')
                .leftJoin('bookTransaction.book', 'book')
                .where('bookTransaction.ledgerItemId = :ledgerItemId', { ledgerItemId: payment.ledgerItem?.id })
                .select([
                    'bookTransaction.fine as fine',
                    'book.bookName as bookName',
                    'DATEDIFF(bookTransaction.returnedAt, bookTransaction.dueDate) as overdueDays',
                ]).getRawMany()
            : []

        return {
            ...payment,
            student: rawPayment.student,
            totalFeesPaid: rawPayment.totalFeesPaid, // this also contains the amount of current payment
            bookTransactions,
        };
    }

    async receiveLibraryFine(dto: LibraryFinePaymentDto) {
        const { isPast, latestAcademicYear } = await this.academicYearsService.isPast();
        if (isPast) throw new BadRequestException('Cannot receive library fine from past academic year');

        const student = await this.getRepository(Student).createQueryBuilder('student')
            .where('student.id = :studentId', { studentId: dto.studentId })
            .leftJoin('student.enrollments', 'enrollments', 'enrollments.academicYearId = :academicYearId', { academicYearId: latestAcademicYear.id })
            .leftJoin('enrollments.ledger', 'ledger')
            .select([
                'student.id',
                'enrollments.id',
                'ledger.id',
            ]).getOne();
        if (!student || !student.enrollments?.length) throw new NotFoundException('Student not found');

        const transactions = await this.bookTransactionsHelper.getUnPaidTransactions(new UnpaidTransactionsQueryDto({ studentId: student.id }));
        if (transactions.length === 0) throw new NotFoundException('No unpaid transactions found');

        const totalAmount = transactions.reduce((acc, curr) => acc + curr.fine, 0);

        const libraryFineHead = await this.getRepository(ChargeHead).findOneBy({ name: CHARGE_HEADS.libraryFine });
        if (!libraryFineHead) throw new InternalServerErrorException('Library fine charge head not found');

        const feeInvoiceItems = transactions.map(transaction => ({
            amount: transaction.fine,
            chargeHead: libraryFineHead,
            remark: `Library fine for ${transaction.bookName}`,
        })) as FeeInvoiceItem[];

        const feeInvoice = this.getRepository(FeeInvoice).create({
            invoiceDate: format(new Date(), 'yyyy-MM-dd'),
            dueDate: format(new Date(), 'yyyy-MM-dd'),
            month: EMonth.None,
            totalAmount: totalAmount,
            invoiceNo: await this.feeInvoiceService.generateInvoiceNo(),
            items: feeInvoiceItems,
            ledgerItem: this.getRepository(LedgerItem).create({
                date: format(new Date(), 'yyyy-MM-dd'),
                ledgerAmount: totalAmount,
                studentLedger: student.enrollments[0].ledger,
                type: ELedgerItemType.LibraryFine,
                remark: 'Library fine invoice',
                createdAt: new Date(Date.now() - (60 * 1000)).toISOString(), // this is to make sure the payment is created after the invoice
            }),
            feePayments: [
                this.getRepository(FeePayment).create({
                    amount: totalAmount,
                    ledgerItem: this.getRepository(LedgerItem).create({
                        date: format(new Date(), 'yyyy-MM-dd'),
                        ledgerAmount: totalAmount,
                        studentLedger: student.enrollments[0].ledger,
                        type: ELedgerItemType.LibraryFine,
                        remark: 'Library fine payment',
                        bookTransactions: transactions,
                    }),
                    paymentMethod: dto.paymentMethod,
                    receiptNo: await this.generateReceiptNo('FINE'),
                    remark: 'Library fine',
                })
            ]
        })

        await this.getRepository(FeeInvoice).save(feeInvoice);

        // update paidAt in transactions
        await this.getRepository(BookTransaction).update({ id: In(transactions.map(t => t.id)) }, { paidAt: new Date().toISOString() })

        return {
            message: 'Library fine received successfully',
        }
    }
}
