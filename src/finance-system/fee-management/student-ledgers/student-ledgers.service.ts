import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { LedgerQueryDto } from './dto/ledger-query.dto';
import { LedgerItem } from './entities/ledger-item.entity';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { AuthUser } from 'src/common/types/global.type';
import { isStudent } from 'src/utils/utils';
import { StudentLedger } from './entities/student-ledger.entity';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';
import { FeeInvoice } from '../fee-invoice/entities/fee-invoice.entity';
import { FeePayment } from '../fee-payments/entities/fee-payment.entity';

@Injectable()
export class StudentLedgersService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
        private readonly academicYearService: AcademicYearsService
    ) { super(dataSource, req); }


    async findAll(queryDto: LedgerQueryDto, currentUser: AuthUser) {
        const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();
        const studentId = isStudent(currentUser) ? currentUser.studentId : queryDto.studentId;

        const querybuilder = this.getRepository(LedgerItem).createQueryBuilder('ledgerItem')
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .leftJoin('studentLedger.enrollment', 'enrollment')
            .leftJoin('ledgerItem.feeInvoice', 'feeInvoice')
            .leftJoin('ledgerItem.feePayment', 'feePayment')
            .where('enrollment.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })

        const ledgerItemsQuerybuilder = querybuilder.clone()
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .orderBy('ledgerItem.createdAt', queryDto.order)
            .andWhere(new Brackets(qb => {
                studentId && qb.andWhere('enrollment.studentId = :studentId', { studentId });

                queryDto.particular === 'invoice' && qb.andWhere('feeInvoice.id IS NOT NULL');

                queryDto.dateFrom && qb.andWhere('DATE(ledgerItem.date) >= DATE(:dateFrom)', { dateFrom: queryDto.dateFrom });
                queryDto.dateTo && qb.andWhere('DATE(ledgerItem.date) <= DATE(:dateTo)', { dateTo: queryDto.dateTo });
            }))
            .select([
                'ledgerItem.id as id',
                'ledgerItem.date as date',
                'ledgerItem.ledgerAmount as ledgerAmount',
                'ledgerItem.type as type',
                'ledgerItem.remark as remark',
                `CASE WHEN feeInvoice.id IS NULL THEN NULL ELSE JSON_OBJECT('id', feeInvoice.id, 'rcvNo', feeInvoice.invoiceNo, 'amount', feeInvoice.totalAmount, 'month', feeInvoice.month) END as feeInvoice`,
                `CASE WHEN feePayment.id IS NULL THEN NULL ELSE JSON_OBJECT('id', feePayment.id, 'rcvNo', feePayment.receiptNo, 'amount', feePayment.amount) END as feePayment`,
            ]);

        const ledgerAmount = await querybuilder.clone()
            .andWhere(new Brackets(qb => {
                studentId && qb.andWhere('enrollment.studentId = :studentId', { studentId });
            }))
            .select('studentLedger.amount', 'ledgerAmount')
            .getRawOne();

        const [data, itemCount] = await Promise.all([
            ledgerItemsQuerybuilder.getRawMany(),
            ledgerItemsQuerybuilder.getCount(),
        ]);

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return {
            data,
            ledgerAmount: ledgerAmount?.ledgerAmount,
            meta: pageMetaDto,
        };
    }

    async getStatistics(currentUser: AuthUser) {
        const currentAcademicYearId = await this.academicYearService.getCurrentAcademicYearId();

        if (!isStudent(currentUser)) throw new ForbiddenException('Access Denied');

        const studentLedger = await this.getRepository(StudentLedger).createQueryBuilder('ledger')
            .leftJoin('ledger.enrollment', 'enrollment')
            .where("enrollment.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .andWhere("enrollment.studentId = :studentId", { studentId: currentUser.studentId })
            .select([
                'ledger.id',
                'ledger.amount',
            ])
            .getOne();

        if (!studentLedger) throw new NotFoundException('Ledger not found');

        const lastInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('invoice')
            .orderBy('invoice.createdAt', 'DESC')
            .leftJoin("invoice.ledgerItem", "ledgerItem")
            .leftJoin("ledgerItem.studentLedger", "studentLedger")
            .where("studentLedger.id = :studentLedgerId", { studentLedgerId: studentLedger.id })
            .select([
                "invoice.id",
                "invoice.totalAmount",
                "invoice.dueDate",
                "invoice.invoiceNo"
            ])
            .limit(1)
            .getOne();

        const lastPayment = await this.getRepository(FeePayment).createQueryBuilder('payment')
            .orderBy('payment.createdAt', 'DESC')
            .leftJoin("payment.ledgerItem", "ledgerItem")
            .leftJoin("ledgerItem.studentLedger", "studentLedger")
            .where("studentLedger.id = :studentLedgerId", { studentLedgerId: studentLedger.id })
            .select([
                "payment.id",
                "payment.amount",
                "payment.createdAt",
            ])
            .limit(1)
            .getOne();

        return {
            studentLedger,
            lastInvoice,
            lastPayment
        }
    }

}
