import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { BookTransaction } from './entities/book-transaction.entity';
import { Brackets, DataSource, In } from 'typeorm';
import { LibraryBookService } from '../library-book/library-book.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { BookTransactionByMemberQueryDto, BookTransactionsQueryDto, EBookTransactionPeriod } from './dto/book-transactions-query.dto';
import { EBookTransactionStatus } from 'src/common/types/global.type';
import { LibraryBook } from '../library-book/entities/library-book.entity';
import { Student } from 'src/students/entities/student.entity';
import { paginatedRawData } from 'src/utils/paginatedData';
import { MAX_BOOK_ISSUE_LIMIT } from 'src/common/CONSTANTS';
import { startOfDayString } from 'src/utils/utils';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { Teacher } from 'src/teachers/entities/teacher.entity';

@Injectable({ scope: Scope.REQUEST })
export class BookTransactionsService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly libraryBookService: LibraryBookService,
    private readonly utilitiesService: UtilitiesService
  ) { super(datasource, req) }

  async create(dto: CreateBookTransactionDto) {
    const { teacherId, studentId } = dto;
    if (!teacherId && !studentId) throw new BadRequestException('Please provide teacherId or studentId');

    // determine member type and id
    const memberId = dto.teacherId ?? dto.studentId;
    const memberType: 'teacher' | 'student' = dto.teacherId ? 'teacher' : 'student';

    // find member
    const member: Teacher | Student = memberType === 'teacher'
      ? await this.getRepository(Teacher).findOne({ where: { id: memberId }, select: { id: true } })
      : await this.getRepository(Student).findOne({ where: { id: memberId }, select: { id: true } });

    if (!member) throw new NotFoundException('Member not found');

    // find book
    const book = await this.getRepository(LibraryBook).findOne({
      where: { id: dto.bookId },
      select: { id: true, issuedCount: true, copiesCount: true }
    });

    if (!book) throw new NotFoundException('Book not found');

    // check if member has any overdue book transactions
    const unpaidTransactions = await this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .where(
        memberType === 'teacher'
          ? 'transaction.teacherId = :memberId'
          : 'transaction.studentId = :memberId',
        { memberId }
      )
      .andWhere(new Brackets(qb => {
        qb.orWhere('DATE(transaction.dueDate) < CURRENT_DATE() AND transaction.returnedAt IS NULL') // currently overdue and not returned yet
          .orWhere('transaction.returnedAt IS NOT NULL AND transaction.paidAt IS NULL AND DATE(transaction.dueDate) < DATE(transaction.returnedAt)') // overdue + returned but not paid
      }))
      .select(['transaction.id']).getMany();

    if (unpaidTransactions.length > 0) throw new BadRequestException(`This ${memberType} has an overdue transaction. Please make the payment first.`);

    // check if member has already issued the book
    const transactionsCount = await this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .where(
        memberType === 'teacher'
          ? 'transaction.teacherId = :memberId'
          : 'transaction.studentId = :memberId',
        { memberId }
      )
      .andWhere("transaction.returnedAt IS NULL")
      .select([
        `COUNT(DISTINCT CASE WHEN transaction.bookId = '${book.id}' THEN transaction.id END) AS currentBookTransactionsCount`,
        "COUNT(DISTINCT transaction.id) AS totalIssuedCount",
      ]).getRawOne();

    if (+transactionsCount.currentBookTransactionsCount > 0) throw new BadRequestException('Book is already issued. Please renew or return.');
    if (+transactionsCount.totalIssuedCount >= MAX_BOOK_ISSUE_LIMIT) throw new BadRequestException(`Maximum of ${MAX_BOOK_ISSUE_LIMIT} book issues allowed.`);

    // check if book is available
    if (!(book.issuedCount < book.copiesCount)) throw new BadRequestException('Book is not available');

    await this.libraryBookService.updateCount(book, 'issued'); // increment issued count

    const transaction = this.getRepository(BookTransaction).create({
      dueDate: dto.dueDate,
      book,
      [memberType]: member, // teacher or student
      renewals: []
    });

    await this.getRepository(BookTransaction).save(transaction);

    return { message: 'Issued successfully' };
  }

  async findAll(queryDto: BookTransactionsQueryDto) {
    const queryBuilder = this.getRepository(BookTransaction).createQueryBuilder('transaction');
    const branchId = this.utilitiesService.getBranchId();

    queryBuilder
      .orderBy("transaction.updatedAt", queryDto.order)
      .limit(queryDto.take) // need to use limit and offset instead of skip and take while using getRawMany
      .offset(queryDto.skip)
      .leftJoin("transaction.student", "student")
      .leftJoin("student.account", "studentAccount")
      .leftJoin("transaction.teacher", "teacher")
      .leftJoin("teacher.account", "teacherAccount")
      .leftJoin("transaction.book", "book")
      .where(new Brackets(qb => {
        if (queryDto.search) {
          qb.andWhere(new Brackets(subQb => {
            subQb.orWhere("LOWER(book.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
              .orWhere("book.bookCode = :exactSearch", { exactSearch: queryDto.search.trim() })
              .orWhere("student.studentId = :exactSearch", { exactSearch: queryDto.search.trim() })
              .orWhere("teacher.teacherId = :exactSearch", { exactSearch: queryDto.search.trim() })
          }))
        };

        branchId && qb.andWhere('book.branchId = :branchId', { branchId });

        if (queryDto.status && queryDto.status in this.transactionByStatusQuery) {
          qb.andWhere(this.transactionByStatusQuery[queryDto.status])
        };

        if (queryDto.period && queryDto.period in this.transactionByPeriodQuery) {
          qb.andWhere(this.transactionByPeriodQuery[queryDto.period])
        };
      }))
      .select([
        "transaction.id AS id",
        "transaction.dueDate as dueDate",
        "transaction.returnedAt as returnedAt",
        "transaction.createdAt as createdAt",
        "CASE WHEN student.id IS NOT NULL THEN student.studentId ELSE teacher.teacherId END AS memberId",
        "transaction.fine as fine",
        "transaction.paidAt as paidAt",
        "transaction.renewals as renewals",
        "book.bookName AS bookName",
        "book.bookCode AS bookCode",
        "CASE WHEN student.id IS NOT NULL THEN studentAccount.lowerCasedFullName ELSE teacherAccount.lowerCasedFullName END AS memberName",
      ])

    return paginatedRawData(queryDto, queryBuilder);
  }

  private transactionByStatusQuery = {
    [EBookTransactionStatus.Issued]: 'transaction.returnedAt IS NULL',
    [EBookTransactionStatus.Returned]: 'transaction.returnedAt IS NOT NULL',
    [EBookTransactionStatus.Overdue]: 'DATE(transaction.dueDate) < CURRENT_DATE() AND transaction.returnedAt IS NULL', // 1 day is subtracted because, dueDate is converted to UTC which is yesterday
    'unpaid': `DATE(transaction.dueDate) < CASE WHEN transaction.returnedAt IS NULL THEN CURRENT_DATE() ELSE DATE(transaction.returnedAt) END AND transaction.paidAt IS NULL`,
    'paid': 'transaction.paidAt IS NOT NULL',
  }

  private transactionByPeriodQuery = {
    [EBookTransactionPeriod.TODAY]: 'DATE(transaction.updatedAt) = CURRENT_DATE()',
    [EBookTransactionPeriod.LAST_WEEK]: 'DATE(transaction.updatedAt) >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 WEEK)',
    [EBookTransactionPeriod.THIS_MONTH]: 'MONTH(transaction.updatedAt) = MONTH(CURRENT_DATE()) AND YEAR(transaction.updatedAt) = YEAR(CURRENT_DATE())',
    [EBookTransactionPeriod.LAST_MONTH]: 'DATE(transaction.updatedAt) >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)',
  }

  /**
   * Returns all the book transactions for a given student.
   * Accounts only for issued and returned transactions.
   */
  async findAllByMember(queryDto: BookTransactionByMemberQueryDto, select?: string[]) {
    const { teacherId, studentId } = queryDto;

    if (!teacherId && !studentId) throw new BadRequestException('Please provide teacherId or studentId');

    const queryBuilder = this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .orderBy("transaction.createdAt", queryDto.order)
      .offset(queryDto.skipPagination ? undefined : queryDto.skip)
      .limit(queryDto.skipPagination ? undefined : queryDto.take)
      .leftJoin("transaction.book", "book");

    if (queryDto.teacherId) {
      queryBuilder.leftJoin("transaction.teacher", "teacher")
        .where("teacher.teacherId = :teacherId", { teacherId: queryDto.teacherId })
    }

    if (queryDto.studentId) {
      queryBuilder.leftJoin("transaction.student", "student")
        .where("student.studentId = :studentId", { studentId: queryDto.studentId })
    }

    queryBuilder
      .andWhere(new Brackets(qb => {
        queryDto.status === EBookTransactionStatus.Issued
          ? qb.andWhere("transaction.returnedAt IS NULL") // issued
          : qb.andWhere("transaction.returnedAt IS NOT NULL") // returned
      }))
      .select(select ?? [
        "transaction.id AS id",
        "transaction.dueDate as dueDate",
        "transaction.returnedAt as returnedAt",
        "transaction.createdAt as createdAt",
        "transaction.renewals as renewals",
        "transaction.fine as fine",
        "book.bookName AS bookName",
        "book.bookCode AS bookCode",
      ])

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(BookTransaction).findOne({
      where: { id },
      relations: {
        book: true,
      },
      select: {
        book: {
          id: true,
          bookName: true,
          bookCode: true,
        }
      }
    })
    if (!existing) throw new NotFoundException('Book transaction not found')

    return existing;
  }

  async returnBook(ids: string[]) {
    const updatedTransactions = await this.getRepository(BookTransaction).createQueryBuilder() // don't use alias while updating
      .update(BookTransaction)
      .set({ returnedAt: new Date().toISOString() })
      .where("id IN (:...ids)", { ids }) // Reference column directly without alias
      .andWhere("returnedAt IS NULL")
      .execute();

    if (updatedTransactions.affected === 0) {
      throw new NotFoundException('Book transaction not found');
    }

    // decrement issued count in books
    const bookTransactions = await this.getRepository(BookTransaction).find({
      where: {
        id: In(ids),
        book: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      relations: { book: true },
      select: { id: true, book: { id: true, issuedCount: true } }
    });

    const updatedBooks = bookTransactions.map(bookTransaction => {
      bookTransaction.book.issuedCount -= 1;
      return bookTransaction.book;
    })
    await this.getRepository(LibraryBook).save(updatedBooks);

    return { message: 'Returned successfully' }
  }

  async renewBookTransaction(ids: string[], dueDate: string) {
    // check if any book transaction has lowered the due date
    const bookTransactions = await this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .whereInIds(ids)
      .andWhere("DATE(transaction.dueDate) >= DATE(:dueDate)", { dueDate })
      .andWhere("returnedAt IS NULL")
      .getMany();

    if (bookTransactions.length > 0) throw new BadRequestException('Due date must be greater than the current due date');

    const updatedTransactions = await this.getRepository(BookTransaction).createQueryBuilder()
      .update(BookTransaction)
      .set({
        dueDate,
        ////renewals: () => "renewals + 1" // Increment renewals by 1
        renewals: () => `IF(renewals IS NULL OR renewals = '', '${startOfDayString(new Date())}', CONCAT(renewals, ',', '${startOfDayString(new Date())}'))`
      })
      .whereInIds(ids)
      .andWhere("returnedAt IS NULL AND DATE(dueDate) >= CURRENT_DATE()")
      .execute();

    if (updatedTransactions.affected === 0) {
      throw new NotFoundException('Book transaction not found');
    }

    return { message: 'Renewed successfully' }
  }
}
