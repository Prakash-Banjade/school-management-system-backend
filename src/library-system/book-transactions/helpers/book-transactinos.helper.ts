import { Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { BookTransaction } from "../entities/book-transaction.entity";
import { BookTransactionsQueryDto, UnpaidTransactionsQueryDto } from "../dto/book-transactions-query.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthUser, EBookTransactionStatus } from "src/common/types/global.type";
import { paginatedRawData } from "src/utils/paginatedData";
import { isStudent, isTeacher } from "src/utils/utils";

@Injectable()
export class BookTransactionsHelper {
    constructor(
        @InjectRepository(BookTransaction) private readonly bookTransactionRepo: Repository<BookTransaction>
    ) { }

    async getUnPaidTransactions(queryDto: UnpaidTransactionsQueryDto, select?: string[]) {
        const querybuilder = this.bookTransactionRepo.createQueryBuilder('transaction')
            .leftJoin('transaction.book', 'book')
            .where('transaction.returnedAt IS NOT NULL') // ensure book is returned
            .andWhere('transaction.paidAt IS NULL') // unpaid transactions
            .andWhere('DATE(transaction.dueDate) < DATE(transaction.returnedAt)'); // only over due transactions

        if (queryDto.studentId) {
            querybuilder.andWhere('transaction.studentId = :studentId', { studentId: queryDto.studentId })
        }

        if (queryDto.teacherId) {
            querybuilder.andWhere('transaction.teacherId = :teacherId', { teacherId: queryDto.teacherId })
        }

        querybuilder
            .select(select ?? [
                'transaction.id as id',
                'book.bookName as bookName',
                'transaction.fine as fine',
                'transaction.dueDate as dueDate',
                'transaction.returnedAt as returnedAt',
                'transaction.createdAt as createdAt',
                'transaction.paidAt as paidAt',
            ]);

        return querybuilder.getRawMany();
    }

    async findAll_MemberView(queryDto: BookTransactionsQueryDto, currentUser: AuthUser) {
        const queryBuilder = this.bookTransactionRepo.createQueryBuilder('transaction');

        queryBuilder
            .orderBy("transaction.updatedAt", queryDto.order)
            .limit(queryDto.take)
            .offset(queryDto.skip)

        if (isStudent(currentUser)) {
            queryBuilder.innerJoin("transaction.student", "student", "student.id = :studentId", { studentId: currentUser.studentId })
        }

        if (isTeacher(currentUser)) {
            queryBuilder.innerJoin("transaction.teacher", "teacher", "teacher.id = :teacherId", { teacherId: currentUser.teacherId })
        }

        queryBuilder
            .leftJoin("transaction.book", "book")
            .where(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(qb => {
                        qb.orWhere("LOWER(book.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                        qb.orWhere("book.bookCode = :search", { search: queryDto.search })
                    }))
                }

                if (queryDto.status) {
                    if (queryDto.status === EBookTransactionStatus.Issued) {
                        qb.andWhere("transaction.returnedAt IS NULL")
                        qb.andWhere("DATE(transaction.dueDate) >= DATE(:today)", { today: new Date().toISOString() })
                    } else if (queryDto.status === EBookTransactionStatus.Returned) {
                        qb.andWhere("transaction.returnedAt IS NOT NULL")
                    } else if (queryDto.status === EBookTransactionStatus.Overdue) {
                        qb.andWhere("DATE(transaction.dueDate) < DATE(:today) AND transaction.returnedAt IS NULL", { today: new Date().toISOString() }) // look for next day, today is not due date
                    }
                }
            }))
            .select([
                "transaction.id AS id",
                "transaction.dueDate as dueDate",
                "transaction.returnedAt as returnedAt",
                "transaction.createdAt as createdAt",
                "transaction.fine as fine",
                "transaction.paidAt as paidAt",
                "book.bookName AS bookName",
                "book.bookCode AS bookCode",
            ])

        return paginatedRawData(queryDto, queryBuilder);
    }
}