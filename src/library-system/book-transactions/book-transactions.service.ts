import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { UpdateBookTransactionDto } from './dto/update-book-transaction.dto';
import { BookTransaction } from './entities/book-transaction.entity';
import { Brackets, DataSource } from 'typeorm';
import { LibraryBookService } from '../library-book/library-book.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { StudentsService } from 'src/students/students.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';

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

    await this.libraryBookService.incrementIssuedCount(book); // increment issued count

    const transaction = this.getRepository(BookTransaction).create({
      book,
      student,
    });

    const savedTransaction = await this.getRepository(BookTransaction).save(transaction);

    return this.bookTransactionMutationReturn(savedTransaction, 'created');
  }


  findAll(queryDto: QueryDto) {
    const queryBuilder = this.getRepository(BookTransaction).createQueryBuilder('bookTransaction');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy("bookTransaction.createdAt", queryDto.order)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(bookTransaction.book.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, queryBuilder)
  }

  async findOne(id: string) {
    const existing = await this.getRepository(BookTransaction).findOne({
      where: { id },
    })
    if (!existing) throw new NotFoundException('Book transaction not found')

    return existing;
  }

  update(id: string, updateBookTransactionDto: UpdateBookTransactionDto) {
    return `This action updates a #${id} bookTransaction`;
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
