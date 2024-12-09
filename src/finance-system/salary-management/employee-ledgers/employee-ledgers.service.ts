import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { EmployeeLedgerQueryDto } from './dto/employee-ledgers-query.dto';
import { EmployeeLedger } from './entities/employee-ledger.entity';
import { paginatedRawData } from 'src/utils/paginatedData';

@Injectable()
export class EmployeeLedgersService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    ) { super(dataSource, req) }

    async findAll(queryDto: EmployeeLedgerQueryDto) {
        const querbuilder = this.getRepository(EmployeeLedger).createQueryBuilder('ledger')
            .orderBy('ledger.date', 'DESC')
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .where(new Brackets(qb => {
                queryDto.employeeId && qb.andWhere('ledger.staffId = :employeeId OR ledger.teacherId = :employeeId', { employeeId: queryDto.employeeId });

                queryDto.dateFrom && qb.andWhere('DATE(ledger.date) >= DATE(:dateFrom)', { dateFrom: queryDto.dateFrom });
                queryDto.dateTo && qb.andWhere('DATE(ledger.date) <= DATE(:dateTo)', { dateTo: queryDto.dateTo });
            }))
            .select([
                'ledger.id as id',
                'ledger.date as date',
                'ledger.amount as amount',
                'ledger.transactionType as transactionType',
                'ledger.staffId as staffId',
                'ledger.teacherId as teacherId',
            ])

        return paginatedRawData(queryDto, querbuilder);
    }
}
