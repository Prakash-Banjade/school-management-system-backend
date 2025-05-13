import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { LibraryBook } from "../entities/library-book.entity";
import { BookTransaction } from "src/library-system/book-transactions/entities/book-transaction.entity";
import { QueryDto } from "src/common/dto/query.dto";
import { AuthUser } from "src/common/types/global.type";
import { isStudent, isTeacher } from "src/utils/utils";
import { UtilitiesService } from "src/utilities/utilities.service";

@Injectable()
export class LibraryHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) {
        super(dataSource, req);
    }

    async getDashboardCount() {
        const branchId = this.utilitiesService.getBranchId();

        const booksCount = this.getRepository(LibraryBook).createQueryBuilder('book')
            .select(['COUNT(book.id) AS totalCount'])
            .where(new Brackets(qb => {
                branchId && qb.andWhere('book.branchId = :branchId', { branchId });
            }))
            .getRawOne();

        const transactionCount = this.getRepository(BookTransaction).createQueryBuilder("transaction")
            .leftJoin("transaction.book", "book")
            .where(new Brackets(qb => {
                branchId && qb.andWhere('book.branchId = :branchId', { branchId });
            }))
            .select([
                "COUNT(transaction.id) AS totalCount",
                `COUNT(CASE WHEN transaction.returnedAt IS NULL THEN 1 END) AS issuedCount`,
                `COUNT(CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) < CURRENT_DATE() THEN 1 END) AS overdueCount`,
            ])
            .getRawOne();

        const membersCount = this.getRepository(BookTransaction).createQueryBuilder("transaction")
            .leftJoin("transaction.student", "student")
            .leftJoin("transaction.teacher", "teacher")
            .leftJoin("transaction.book", "book")
            .where(new Brackets(qb => {
                branchId && qb.andWhere('book.branchId = :branchId', { branchId });
            }))
            .select([
                "COUNT(DISTINCT student.id) AS totalStudentCount",
                `COUNT(DISTINCT CASE WHEN transaction.returnedAt IS NULL THEN student.id END) AS issuedStudentCount`,
                "COUNT(DISTINCT teacher.id) AS totalTeacherCount",
                `COUNT(DISTINCT CASE WHEN transaction.returnedAt IS NULL THEN teacher.id END) AS issuedTeacherCount`,
            ])
            .getRawOne();

        const topBooks = await this.getRepository(BookTransaction).createQueryBuilder("transaction")
            .leftJoin("transaction.book", "book")
            .where(new Brackets(qb => {
                branchId && qb.andWhere('book.branchId = :branchId', { branchId });
            }))
            .select([
                "book.id AS bookId",
                "book.bookName AS bookName",
                "COUNT(transaction.id) AS transactionCount"
            ])
            .groupBy("book.id")
            .orderBy("transactionCount", "DESC")
            .limit(3)
            .getRawMany();


        const data = await Promise.all([booksCount, transactionCount, membersCount, topBooks]);

        return {
            booksCount: +data[0].totalCount,
            transactionCount: +data[1].totalCount,
            issuedCount: +data[1].issuedCount,
            overdueCount: +data[1].overdueCount,
            membersCount: +data[2].totalStudentCount + +data[2].totalTeacherCount,
            issuedMembersCount: +data[2].issuedStudentCount + +data[2].issuedTeacherCount,
            topBooks: data[3]
        };
    }

    async getDashboardCount_member(currentUser: AuthUser) {
        const querybuilder = this.getRepository(BookTransaction).createQueryBuilder("transaction")

        if (isTeacher(currentUser)) {
            querybuilder.where("transaction.teacherId = :teacherId", { teacherId: currentUser.teacherId })
        }

        if (isStudent(currentUser)) {
            querybuilder.where("transaction.studentId = :studentId", { studentId: currentUser.studentId })
        }

        querybuilder
            .select([
                "COUNT(transaction.id) AS totalCount",
                `COUNT(CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) >= DATE(:today) THEN 1 END) AS issuedCount`,
                `COUNT(CASE WHEN transaction.returnedAt IS NULL AND DATE(transaction.dueDate) < DATE(:today) THEN 1 END) AS overdueCount`,
            ])
            .setParameter("today", new Date().toISOString().split("T")[0])

        return querybuilder.getRawOne();
    }

    async getOptions(queryDto: QueryDto) {

        const querybuilder = this.getRepository(LibraryBook).createQueryBuilder('book')
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
            ]);

        this.utilitiesService.applyBranchFilter(querybuilder, 'book.branchId = :branchId');

        return querybuilder.getRawMany();
    }
}