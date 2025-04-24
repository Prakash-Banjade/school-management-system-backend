import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Student } from 'src/students/entities/student.entity';
import { Brackets, DataSource } from 'typeorm';
import { StudentLedger } from './entities/student-ledger.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { LedgerQueryDto } from './dto/ledger-query.dto';
import { LedgerItem } from './entities/ledger-item.entity';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { AuthUser } from 'src/common/types/global.type';
import { isStudent } from 'src/utils/utils';

@Injectable()
export class StudentLedgersService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) { super(dataSource, req); }

    async createStudentsLedger() { // TODO: remove in production
        const academicYearId = await this.utilitiesService.getAcademicYearId();

        const students = await this.getRepository(Student).createQueryBuilder('student')
            .leftJoin('student.enrollments', 'enrollments')
            .where('enrollments.academicYearId = :academicYearId', { academicYearId: academicYearId })
            .select(['student.id', 'enrollments.id'])
            .getMany();

        const enrollments = students.map(student => {
            const enrollment = student.enrollments[0];
            enrollment.ledger = this.getRepository(StudentLedger).create();
            return enrollment;
        });

        await this.getRepository(Enrollment).save(enrollments);
    }

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

}
