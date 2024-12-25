import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { BookTransactionsQueryDto } from "./dto/book-transactions-query.dto";
import { BookTransaction } from "./entities/book-transaction.entity";
import { AuthUser, EBookTransactionStatus } from "src/common/types/global.type";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";
import { isStudent } from "src/utils/utils";

@Injectable()
export class BookTransactionsStudentViewService extends BaseRepository {
    constructor(
        dataSource: DataSource,
        @Inject(REQUEST) private req: FastifyRequest,
    ) { super(dataSource, req) }

    async findAll(queryDto: BookTransactionsQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException();

        const queryBuilder = this.getRepository(BookTransaction).createQueryBuilder('transaction');

        queryBuilder
            .orderBy("transaction.updatedAt", queryDto.order)
            .limit(queryDto.take) // need to use limit and offset instead of skip and take while using getRawMany
            .offset(queryDto.skip)
            .leftJoin("transaction.student", "student", "student.id = :studentId", { studentId: currentUser.studentId })
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
                "book.bookName AS bookName",
                "book.bookCode AS bookCode",
            ])

        const itemCount = await queryBuilder.getCount();
        const data = await queryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return new PageDto(data, pageMetaDto);
    }
}