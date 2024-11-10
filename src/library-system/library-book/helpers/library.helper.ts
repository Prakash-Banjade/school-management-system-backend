import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { LibraryBook } from "../entities/library-book.entity";
import { BookTransaction } from "src/library-system/book-transactions/entities/book-transaction.entity";
import { QueryDto } from "src/common/dto/query.dto";
import { AuthUser } from "src/common/types/global.type";

@Injectable()
export class LibraryHelper extends BaseRepository {
    constructor(
        dataSource: DataSource,
        @Inject(REQUEST) private req: FastifyRequest,
    ) {
        super(dataSource, req);
    }

    async getDashboardCount() {
        const booksCount = this.getRepository(LibraryBook).createQueryBuilder('book')
            .select(['COUNT(book.id) AS totalCount'])
            .getRawOne();

        const transactionCount = this.getRepository(BookTransaction).createQueryBuilder("transaction")
            .leftJoin("transaction.student", "student")
            .select([
                "COUNT(transaction.id) AS totalCount",
                `COUNT(CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) >= DATE(:today) THEN 1 END) AS issuedCount`,
                `COUNT(CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) < DATE(:today) THEN 1 END) AS overdueCount`,
            ])
            .setParameter("today", new Date().toISOString().split("T")[0])
            .getRawOne();

        const studentsCount = this.getRepository(BookTransaction).createQueryBuilder("transaction")
            .leftJoin("transaction.student", "student")
            .select([
                "COUNT(DISTINCT student.id) AS totalStudentCount",
                `COUNT(DISTINCT CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) >= DATE(:today) THEN student.id END) AS issuedStudentCount`
            ])
            .setParameter("today", new Date().toISOString().split("T")[0])
            .getRawOne();

        const topBooks = await this.getRepository(BookTransaction).createQueryBuilder("transaction")
            .leftJoin("transaction.book", "book")
            .select([
                "book.id AS bookId",
                "book.bookName AS bookName",
                "COUNT(transaction.id) AS transactionCount"
            ])
            .groupBy("book.id")
            .orderBy("transactionCount", "DESC")
            .limit(3)
            .getRawMany();


        const data = await Promise.all([booksCount, transactionCount, studentsCount, topBooks]);

        return {
            booksCount: +data[0].totalCount,
            transactionCount: +data[1].totalCount,
            issuedCount: +data[1].issuedCount,
            overdueCount: +data[1].overdueCount,
            studentsCount: +data[2].totalStudentCount,
            issuedStudentCount: +data[2].issuedStudentCount,
            topBooks: data[3]
        };
    }

    async getDashboardCount_student(currentUser: AuthUser) {
        const transactionCount = await this.getRepository(BookTransaction).createQueryBuilder("transaction")
            .leftJoin("transaction.student", "student")
            .select([
                "COUNT(transaction.id) AS totalCount",
                `COUNT(CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) >= DATE(:today) THEN 1 END) AS issuedCount`,
                `COUNT(CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) < DATE(:today) THEN 1 END) AS overdueCount`,
            ])
            .setParameter("today", new Date().toISOString().split("T")[0])
            .getRawOne();

        return transactionCount;
    }

    async getOptions(queryDto: QueryDto) {

        const options = await this.getRepository(LibraryBook).createQueryBuilder('book')
            .orderBy("book.createdAt", queryDto.order)
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .where(new Brackets(qb => {
                if (queryDto.search) {
                    qb.where("book.bookCode = :exactSearch", { exactSearch: queryDto.search })
                        .orWhere("LOWER(book.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                }
            }))
            .select([
                "book.id as value",
                "book.bookName as label"
            ])
            .getRawMany();

        return options;
    }
}