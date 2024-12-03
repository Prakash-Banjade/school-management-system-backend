import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { BookTransaction } from './entities/book-transaction.entity';
import { Brackets, DataSource, In } from 'typeorm';
import { LibraryBookService } from '../library-book/library-book.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { BookTransactionByStudentQueryDto, BookTransactionsQueryDto, EBookTransactionPeriod } from './dto/book-transactions-query.dto';
import { EBookTransactionStatus } from 'src/common/types/global.type';
import { LibraryBook } from '../library-book/entities/library-book.entity';
import { Student } from 'src/students/entities/student.entity';
import { paginatedRawData } from 'src/utils/paginatedData';
import { MAX_BOOK_ISSUE_LIMIT } from 'src/common/CONSTANTS';
import { startOfDayString } from 'src/utils/utils';

@Injectable({ scope: Scope.REQUEST })
export class BookTransactionsService extends BaseRepository {
  constructor(
    datasource: DataSource,
    @Inject(REQUEST) req: FastifyRequest,
    private readonly libraryBookService: LibraryBookService,
  ) {
    super(datasource, req);
  }

  async create(createBookTransactionDto: CreateBookTransactionDto) {
    const book = await this.libraryBookService.findOne(createBookTransactionDto.bookId);
    const student = await this.getRepository(Student).findOne({
      where: { id: createBookTransactionDto.studentId },
      select: { id: true }
    });
    if (!student) throw new NotFoundException('Student not found');

    // check if student has any overdue book transactions
    const unpaidTransactions = await this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .where('transaction.studentId = :studentId', { studentId: student.id })
      .andWhere(new Brackets(qb => {
        qb.orWhere('DATE(transaction.dueDate) < CURRENT_DATE() AND transaction.returnedAt IS NULL') // currently overdue and not returned yet
          .orWhere('transaction.returnedAt IS NOT NULL AND transaction.paidAt IS NULL AND DATE(transaction.dueDate) < DATE(transaction.returnedAt)') // overdue + returned but not paid
      }))
      .select(['transaction.id']).getMany();

    if (unpaidTransactions.length > 0) throw new BadRequestException('This student has an overdue transaction. Please make the payment first.');

    const transactionsCount = await this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .where("transaction.studentId = :studentId", { studentId: student.id })
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
      dueDate: createBookTransactionDto.dueDate,
      book,
      student,
      renewals: []
    });

    await this.getRepository(BookTransaction).save(transaction);

    return this.bookTransactionMutationReturn('created');
  }

  async findAll(queryDto: BookTransactionsQueryDto) {
    const queryBuilder = this.getRepository(BookTransaction).createQueryBuilder('transaction');

    queryBuilder
      .orderBy("transaction.updatedAt", queryDto.order)
      .limit(queryDto.take) // need to use limit and offset instead of skip and take while using getRawMany
      .offset(queryDto.skip)
      .leftJoin("transaction.student", "student")
      .leftJoin("transaction.book", "book")
      .leftJoin("student.classRoom", "classRoom")
      .leftJoin("classRoom.parent", "parent")
      .where(new Brackets(qb => {
        if (queryDto.search) {
          qb.andWhere(new Brackets(subQb => {
            subQb.orWhere("LOWER(book.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
              .orWhere("TRIM(book.bookCode) = TRIM(:exactSearch)", { exactSearch: queryDto.search })
              .orWhere("TRIM(student.studentId) = TRIM(:exactSearch)", { exactSearch: queryDto.search })
          }))
        };

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
        "student.studentId AS studentId",
        "transaction.fine as fine",
        "transaction.paidAt as paidAt",
        "transaction.renewals as renewals",
        "book.bookName AS bookName",
        "book.bookCode AS bookCode",
        "CONCAT(student.firstName, ' ', student.lastName) AS studentName",
        "parent.name AS parentClassName",
        "classRoom.name AS classRoomName",
      ])

    return paginatedRawData(queryDto, queryBuilder);
  }

  private transactionByStatusQuery = {
    [EBookTransactionStatus.Issued]: 'transaction.returnedAt IS NULL',
    [EBookTransactionStatus.Returned]: 'transaction.returnedAt IS NOT NULL',
    [EBookTransactionStatus.Overdue]: 'DATE(transaction.dueDate) < CURRENT_DATE() AND transaction.returnedAt IS NULL', // 1 day is subtracted because, dueDate is converted to UTC which is yesterday
    'unpaid': 'DATE(transaction.dueDate) < CURRENT_DATE() AND transaction.returnedAt IS NULL AND transaction.paidAt IS NULL',
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
  async findAllByStudent(queryDto: BookTransactionByStudentQueryDto) {
    const queryBuilder = this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .orderBy("transaction.createdAt", queryDto.order)
      .offset(queryDto.skipPagination ? undefined : queryDto.skip)
      .limit(queryDto.skipPagination ? undefined : queryDto.take)
      .leftJoin("transaction.student", "student")
      .leftJoin("transaction.book", "book")
      .where(new Brackets(qb => {
        qb.andWhere("student.studentId = :studentId", { studentId: queryDto.studentId })
        queryDto.status === EBookTransactionStatus.Issued
          ? qb.andWhere("transaction.returnedAt IS NULL") // issued
          : qb.andWhere("transaction.returnedAt IS NOT NULL") // returned
      }))
      .select([
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
      where: { id: In(ids) },
      relations: { book: true }
    });

    const updatedBooks = bookTransactions.map(bookTransaction => {
      bookTransaction.book.issuedCount -= 1;
      return bookTransaction.book;
    })
    await this.getRepository(LibraryBook).save(updatedBooks);

    return this.bookTransactionMutationReturn('returned');
  }

  async renewBookTransaction(ids: string[], dueDate: string) {
    // check if any book transaction has lowered the due date
    const bookTransactions = await this.getRepository(BookTransaction).createQueryBuilder('transaction')
      .whereInIds(ids)
      .andWhere("DATE(transaction.dueDate) >= :dueDate", { dueDate })
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

    return this.bookTransactionMutationReturn('renewed');
  }

  private bookTransactionMutationReturn(type: 'created' | 'returned' | 'renewed' | 'deleted') {
    return {
      message: type === 'created'
        ? 'Issued successfully'
        : type === 'deleted'
          ? 'Transaction deleted'
          : type === 'renewed'
            ? 'Renewed successfully'
            : type === 'returned'
              ? 'Returned successfully'
              : 'Book transaction updated successfully',
    }
  }
}
