import { Module } from '@nestjs/common';
import { BookTransactionsService } from './book-transactions.service';
import { BookTransactionsController } from './book-transactions.controller';
import { BookTransaction } from './entities/book-transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryBookModule } from '../library-book/library-book.module';
import { BookTransactionsStudentViewService } from './book-transactions-student-view.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookTransaction,
    ]),
    LibraryBookModule
  ],
  controllers: [BookTransactionsController],
  providers: [
    BookTransactionsService,
    BookTransactionsStudentViewService
  ],
})
export class BookTransactionsModule { }
