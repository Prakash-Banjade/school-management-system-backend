import { Module } from '@nestjs/common';
import { LibraryBookModule } from './library-book/library-book.module';
import { BookTransactionsModule } from './book-transactions/book-transactions.module';

@Module({
    imports: [
        LibraryBookModule,
        BookTransactionsModule,
    ],
})
export class LibrarySystemModule {}
