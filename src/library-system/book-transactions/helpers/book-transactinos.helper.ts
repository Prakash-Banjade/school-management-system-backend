import { Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { BookTransaction } from "../entities/book-transaction.entity";
import { UnpaidTransactionsQueryDto } from "../dto/book-transactions-query.dto";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class BookTransactionsHelper {
    constructor(
        @InjectRepository(BookTransaction) private readonly bookTransactionRepo: Repository<BookTransaction>
    ) { }

    async getUnPaidTransactions(queryDto: UnpaidTransactionsQueryDto) {
        const querybuilder = this.bookTransactionRepo.createQueryBuilder('transaction')
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