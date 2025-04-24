import { ForbiddenException, Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { BookTransactionsQueryDto } from "./dto/book-transactions-query.dto";
import { BookTransaction } from "./entities/book-transaction.entity";
import { AuthUser, EBookTransactionStatus } from "src/common/types/global.type";
import { isStudent } from "src/utils/utils";
import { InjectRepository } from "@nestjs/typeorm";
import { paginatedRawData } from "src/utils/paginatedData";

@Injectable()
export class BookTransactionsStudentViewService {
    constructor(
        @InjectRepository(BookTransaction) private readonly bookTransactionRepo: Repository<BookTransaction>,
    ) { }

    async findAll(queryDto: BookTransactionsQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException();

        const queryBuilder = this.bookTransactionRepo.createQueryBuilder('transaction');

        queryBuilder
            .orderBy("transaction.updatedAt", queryDto.order)
            .limit(queryDto.take) // need to use limit and offset instead of skip and take while using getRawMany
            .offset(queryDto.skip)
            .innerJoin("transaction.student", "student", "student.id = :studentId", { studentId: currentUser.studentId })
            .leftJoin("transaction.book", "book")
            .where(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(qb => {
                        qb.orWhere("LOWER(book.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                        qb.orWhere("book.bookCode = :search", { search: queryDto.search })
                        qb.orWhere("student.studentId = :search", { search: queryDto.search })
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