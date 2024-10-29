import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { BookTransaction } from './entities/book-transaction.entity';
import { Brackets, DataSource, In, IsNull } from 'typeorm';
import { LibraryBookService } from '../library-book/library-book.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';
import { BookTransactionByStudentQueryDto, BookTransactionsQueryDto } from './dto/book-transactions-query.dto';
import { EBookTransactionStatus } from 'src/common/types/global.type';
import { StudentsService } from 'src/students/students.service';
import { LibraryBook } from '../library-book/entities/library-book.entity';

@Injectable({ scope: Scope.REQUEST })
export class BookTransactionsService extends BaseRepository {
  constructor(
    datasource: DataSource,
    @Inject(REQUEST) req: FastifyRequest,
    private readonly libraryBookService: LibraryBookService,
    private readonly studentsService: StudentsService
  ) {
    super(datasource, req);
  }

  async create(createBookTransactionDto: CreateBookTransactionDto) {
    const book = await this.libraryBookService.findOne(createBookTransactionDto.bookId);
    const student = await this.studentsService.findOne(createBookTransactionDto.studentId);

    // check if student has already issued this book
    const bookTransactions = await this.getRepository(BookTransaction).find({
      where: {
        book: { id: book.id },
        student: { id: student.id },
        returnedAt: IsNull(),
      }
    });
    if (bookTransactions.length > 0) throw new BadRequestException('Book is already issued. Please renew or return.');

    // check if book is available
    if (!(book.issuedCount < book.copiesCount)) throw new BadRequestException('Book is not available');

    await this.libraryBookService.updateCount(book, 'issued'); // increment issued count

    const transaction = this.getRepository(BookTransaction).create({
      dueDate: createBookTransactionDto.dueDate,
      book,
      student,
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
        "student.studentId AS studentId",
        "book.bookName AS bookName",
        "book.bookCode AS bookCode",
        "CONCAT(student.firstName, ' ', student.lastName) AS studentName",
        "parent.name AS parentClassName",
        "classRoom.name AS classRoomName",
      ])

    const itemCount = await queryBuilder.getCount();
    const data = await queryBuilder.getRawMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(data, pageMetaDto);
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
        "book.bookName AS bookName",
        "book.bookCode AS bookCode",
      ])

    const itemCount = await queryBuilder.getCount();
    const data = await queryBuilder.getRawMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(data, pageMetaDto);
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
    const updatedTransactions = await this.getRepository(BookTransaction).createQueryBuilder()
      .update(BookTransaction)
      .set({
        dueDate,
        renewals: () => "renewals + 1" // Increment renewals by 1
      })
      .where("id IN (:...ids)", { ids })
      .andWhere("returnedAt IS NULL")
      .execute();

    if (updatedTransactions.affected === 0) {
      throw new NotFoundException('Book transaction not found');
    }

    return this.bookTransactionMutationReturn('renewed');
  }

  remove(id: string) {
    return `This action removes a #${id} bookTransaction`;
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
