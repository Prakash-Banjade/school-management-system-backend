import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { Student } from 'src/students/entities/student.entity';
import { FeeInvoice } from './entities/fee-invoice.entity';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';
import { FeeInvoiceItem } from './entities/fee-invoice-item.entity';
import { ChargeHead, EChargeHeadPeriod } from '../charge-heads/entities/charge-head.entity';
import { StudentLedger } from '../student-ledgers/entities/student-ledger.entity';
import { ELedgerItemType, LedgerItem } from '../student-ledgers/entities/ledger-item.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EFeeInvoiceEvent, FeeInvoiceCreatedEvent } from './fee-invoice.mailer';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { AuthUser } from 'src/common/types/global.type';
import { isStudent } from 'src/utils/utils';

@Injectable({ scope: Scope.REQUEST })
export class FeeInvoiceService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly eventEmitter: EventEmitter2,
        private readonly academicYearsService: AcademicYearsService
    ) { super(dataSource, req); }

    async create(dto: CreateFeeInvoiceDto) {
        const { isPast, latestAcademicYear } = await this.academicYearsService.isPast();
        if (isPast) throw new BadRequestException('Cannot create fee invoice for past academic year');

        const student = await this.getRepository(Student).createQueryBuilder('student')  // TODO: assuming student is of current academic year
            .leftJoin('student.enrollments', 'enrollments', 'enrollments.academicYearId = :academicYearId', { academicYearId: latestAcademicYear.id })
            .leftJoin('enrollments.ledger', 'ledger')
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .where('student.id = :studentId', { studentId: dto.studentId })
            .select([
                'student.id',
                'enrollments.id',
                "enrollments.oneTimeChargeIds",
                'ledger.id',
                'ledger.amount',
                'classRoom.id',
                'parent.id',
            ]).getOne();
        if (!student) throw new NotFoundException('Student not found');

        const ledger = student.enrollments[0]?.ledger;

        if (!ledger) throw new InternalServerErrorException('Ledger associated with student not found');

        // check if invoice for one tiem charge head already exists
        const enrollment = student.enrollments[0];
        enrollment.oneTimeChargeIds = enrollment?.oneTimeChargeIds ?? []; // resetting if default is null;
        if (enrollment.oneTimeChargeIds?.some(id => dto.invoiceItems?.some(item => item.chargeHeadId === id))) throw new ConflictException('Invoice already exists for one time charge head');

        // validate month
        const pastMonthFeeInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .leftJoin('feeInvoice.ledgerItem', 'ledgerItem')
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .leftJoin('studentLedger.enrollment', 'enrollment')
            .where('enrollment.studentId = :studentId', { studentId: student.id })
            .andWhere('enrollment.academicYearId = :academicYearId', { academicYearId: latestAcademicYear.id })
            .orderBy('feeInvoice.createdAt', 'DESC')
            .getOne();

        if (pastMonthFeeInvoice && pastMonthFeeInvoice.month >= dto.month) throw new BadRequestException('Fee invoice for this month already exists');

        // TODO: assuming all the amounts are valid and correctly calculated

        let grandTotal = 0;
        const invoiceItems = await Promise.all(dto.invoiceItems.map(async item => {
            const chargeHead = await this.getRepository(ChargeHead).createQueryBuilder('chargeHead')
                .leftJoin('chargeHead.feeStructures', 'feeStructures', 'feeStructures.classRoomId = :classRoomId', {
                    classRoomId: enrollment.classRoom?.parent?.id ?? enrollment.classRoom?.id
                })
                .where('chargeHead.id = :chargeHeadId', { chargeHeadId: item.chargeHeadId })
                .select([
                    'chargeHead.id',
                    'chargeHead.name',
                    'feeStructures.amount',
                    'chargeHead.period',
                ]).getOne();

            if (!chargeHead) throw new NotFoundException('Charge head not found');

            const amount = item.amount ?? chargeHead.feeStructures[0]?.amount; // ensuring the amount is as per fee structure
            grandTotal += this.calculateAmountAfterDiscount(amount, item.discount);

            if (chargeHead.period === EChargeHeadPeriod.One_Time) { // storing one time charge head id in enrollment
                enrollment.oneTimeChargeIds.push(chargeHead.id);
            }

            return this.getRepository(FeeInvoiceItem).create({
                amount,
                discount: item.discount,
                chargeHead,
                remark: item.remark,
            });
        }));

        const feeInvoice = this.getRepository(FeeInvoice).create({
            invoiceNo: await this.generateInvoiceNo(),
            month: dto.month,
            totalAmount: grandTotal,
            dueDate: dto.dueDate,
            invoiceDate: dto.invoiceDate,
            items: invoiceItems,
            ledgerItem: this.getRepository(LedgerItem).create({
                date: dto.invoiceDate,
                ledgerAmount: ledger.amount + grandTotal, // this is ths snapshot of the ledger at the time of invoice creation
                studentLedger: ledger,
                type: ELedgerItemType.Invoice,
                remark: 'Monthly Fee invoice',
            })
        });

        await this.getRepository(FeeInvoice).save(feeInvoice);

        // update ledger amount
        await this.getRepository(StudentLedger).update({ id: ledger.id }, { amount: ledger.amount + grandTotal });

        // save enrollment
        await this.getRepository(Enrollment).update({ id: enrollment.id }, { oneTimeChargeIds: enrollment.oneTimeChargeIds });

        // emit event to send mails and sms notifications
        this.eventEmitter.emit(EFeeInvoiceEvent.Created, new FeeInvoiceCreatedEvent({ feeInvoice, studentId: student.id }));

        return {
            message: 'Invoice created',
            invoiceNo: feeInvoice.invoiceNo
        }
    }

    private readonly calculateAmountAfterDiscount = (amount: number, discount: number) => {
        return amount - (amount * discount / 100);
    }

    async generateInvoiceNo() {
        const lastInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .orderBy('feeInvoice.createdAt', 'DESC')
            .limit(1)
            .select(['feeInvoice.id', 'feeInvoice.invoiceNo'])
            .getOne();

        if (!lastInvoice) {
            return `INV-${new Date().getFullYear()}-00001`
        } else {
            const invDigit = (+lastInvoice.invoiceNo.split('-').at(-1) + 1).toString().padStart(5, '0');
            return `INV-${new Date().getFullYear()}-${invDigit}`;
        }
    }

    async getLastInvoice(studentId: string) {
        const latestAcademicYear = await this.academicYearsService.latest();

        const queryBuilder = this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .leftJoin('feeInvoice.feePayments', 'feePayments')
            .leftJoin('feeInvoice.ledgerItem', 'ledgerItem')
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .leftJoin('studentLedger.enrollment', 'enrollment')
            .leftJoin('feeInvoice.items', 'items')
            .leftJoin('items.chargeHead', 'chargeHead')
            .where('enrollment.studentId = :studentId', { studentId })
            .andWhere('ledgerItem.type = :type', { type: ELedgerItemType.Invoice }) // ensure only fee invoice is returned not fine
            .andWhere('enrollment.academicYearId = :academicYearId', { academicYearId: latestAcademicYear.id })
            .andWhere('studentLedger.amount > 0') // ensure the student has a previous due amount
            .orderBy('feeInvoice.createdAt', 'DESC')
            .select([
                'feeInvoice.id',
                'feeInvoice.month',
                'feeInvoice.totalAmount',
                'chargeHead.name',
                'ledgerItem.id',
                'ledgerItem.ledgerAmount',
                'studentLedger.amount',
                'items.id',
                'items.discount',
                'items.amount',
                'items.remark',
                'chargeHead.id',
                'chargeHead.name',
            ])
            .addSelect('SUM(feePayments.amount)', 'totalFeesPaid')
            .groupBy('feeInvoice.id')
            .addGroupBy('items.id')

        const invoice = await queryBuilder.getOne();
        const rawInvoice = await queryBuilder.getRawOne();

        if (!invoice) return null;

        return {
            ...invoice,
            totalFeesPaid: rawInvoice.totalFeesPaid
        };
    }

    async findOne(id: string, currentUser: AuthUser) {
        const queryBuilder = this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .leftJoin('feeInvoice.feePayments', 'feePayments')
            .leftJoin('feeInvoice.ledgerItem', 'ledgerItem')
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .leftJoin('studentLedger.enrollment', 'enrollment')
            .leftJoin('enrollment.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('enrollment.student', 'student')
            .leftJoin('feeInvoice.items', 'items')
            .leftJoin('items.chargeHead', 'chargeHead')
            .where('feeInvoice.id = :id', { id })
            .select([
                'feeInvoice.id',
                'feeInvoice.month',
                'feeInvoice.invoiceNo',
                'feeInvoice.invoiceDate',
                'feeInvoice.dueDate',
                'feeInvoice.totalAmount',
                'ledgerItem.id',
                'ledgerItem.ledgerAmount',
                'items.id',
                'items.amount',
                'items.discount',
                'items.remark',
                'chargeHead.id',
                'chargeHead.name',
                // 'feePayments.amount'
            ]);

        if (isStudent(currentUser)) { // student can view only their own invoice
            queryBuilder.andWhere('student.id = :studentId', { studentId: currentUser.studentId });
        }

        queryBuilder
            .addSelect('SUM(feePayments.amount)', 'totalFeesPaid')
            .addSelect(`
                JSON_OBJECT(
                    "id", student.id,
                    "studentId", student.studentId,
                    "name", CONCAT(student.firstName, ' ', student.lastName),
                    "email", student.email,
                    "phone", student.phone,
                    "rollNo", enrollment.rollNo,
                    "classRoomName", CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, " - ", classRoom.name) END
                )`, 'student'
            )
            .groupBy('feeInvoice.id')
            .addGroupBy('items.id')
            .addGroupBy('feePayments.id')
            .addGroupBy('feePayments.amount')

        const invoice = await queryBuilder.getOne();

        const rawInvoice = await queryBuilder.getRawOne();

        if (!invoice) throw new NotFoundException('Invoice not found');

        return {
            ...invoice,
            totalFeesPaid: rawInvoice.totalFeesPaid,
            student: rawInvoice.student,
        };
    }
}
