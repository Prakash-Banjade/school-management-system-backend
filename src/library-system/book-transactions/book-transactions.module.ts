import { Module } from '@nestjs/common';
import { BookTransactionsService } from './book-transactions.service';
import { BookTransactionsController } from './book-transactions.controller';
import { BookTransaction } from './entities/book-transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryBookModule } from '../library-book/library-book.module';
import { BookTransactionsCron } from './book-transactions.cron';
import { GeneralSetting } from 'src/general-settings/entities/general-setting.entity';
import { BookTransactionsHelper } from './helpers/book-transactinos.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookTransaction,
      GeneralSetting,
    ]),
    LibraryBookModule
  ],
  controllers: [
    BookTransactionsController,

  ],
  providers: [
    BookTransactionsService,
    BookTransactionsCron,
    BookTransactionsHelper,
  ],
  exports: [BookTransactionsService, BookTransactionsHelper],
})
export class BookTransactionsModule { }
