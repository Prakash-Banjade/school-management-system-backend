import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { BookTransaction } from './entities/book-transaction.entity';
import { Brackets, DataSource } from 'typeorm';
import { LibraryBookService } from '../library-book/library-book.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { StudentsService } from 'src/students/students.service';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';
import { BookTransactionsQueryDto } from './dto/book-transactions-query.dto';
import { EBookTransactionStatus } from 'src/common/types/global.type';

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
    if (!(book.issuedCount < book.copiesCount)) throw new BadRequestException('Book is not available');

    const student = await this.studentsService.findOne(createBookTransactionDto.studentId);

    await this.libraryBookService.updateCount(book, 'issued'); // increment issued count

    const transaction = this.getRepository(BookTransaction).create({
      dueDate: createBookTransactionDto.dueDate,
      book,
      student,
    });

    const savedTransaction = await this.getRepository(BookTransaction).save(transaction);

    return this.bookTransactionMutationReturn(savedTransaction, 'created');
  }

  async findAll(queryDto: BookTransactionsQueryDto) {
    const queryBuilder = this.getRepository(BookTransaction).createQueryBuilder('transaction');

    queryBuilder
      .orderBy("transaction.updatedAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
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
          } else if (queryDto.status === EBookTransactionStatus.Returned) {
            qb.andWhere("transaction.returnedAt IS NOT NULL")
          } else if (queryDto.status === EBookTransactionStatus.Overdue) {
            qb.andWhere("transaction.dueDate < :today", { today: new Date().toISOString().split('T')[0] })
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

  async returnBook(id: string) {
    const existing = await this.findOne(id);

    existing.returnedAt = new Date().toISOString();
    await this.libraryBookService.updateCount(existing.book, 'returned'); // decrement issued count

    const saved = await this.getRepository(BookTransaction).save(existing);

    return this.bookTransactionMutationReturn(saved, 'updated');
  }

  remove(id: string) {
    return `This action removes a #${id} bookTransaction`;
  }
  private bookTransactionMutationReturn(bookTransaction: BookTransaction, type: 'created' | 'updated' | 'deleted') {
    return {
      message: type === 'created' ? 'Book transaction created successfully' : type === 'deleted' ? 'Book transaction deleted successfully' : 'Book transaction updated successfully',
      bookTransaction: {
        id: bookTransaction.id,
        book: {
          id: bookTransaction.book.id,
          name: bookTransaction.book.bookName,
        }
      }
    }
  }
}
