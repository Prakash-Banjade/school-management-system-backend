import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { BookTransaction } from "../entities/book-transaction.entity";
import { UnpaidTransactionsQueryDto } from "../dto/book-transactions-query.dto";

@Injectable()
export class BookTransactionsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    ) { super(dataSource, req) }

    async getUnPaidTransactions(queryDto: UnpaidTransactionsQueryDto) {
        const querybuilder = this.getRepository(BookTransaction).createQueryBuilder('transaction')
            .leftJoin('transaction.book', 'book')
            .where('transaction.returnedAt IS NOT NULL') // ensure book is returned
            .andWhere('transaction.paidAt IS NULL') // unpaid transactions
            .andWhere('DATE(transaction.dueDate) < DATE(transaction.returnedAt)') // only over due transactions
            .andWhere(new Brackets(qb => {
                queryDto.studentId && qb.where('transaction.studentId = :studentId', { studentId: queryDto.studentId })
            }))
            .select([
                'transaction.id as id',
                'book.bookName as bookName',
                'transaction.fine as fine',
                'transaction.dueDate as dueDate',
                'transaction.returnedAt as returnedAt',
                'transaction.createdAt as createdAt',
            ]);

        return querybuilder.getRawMany();
    }
}