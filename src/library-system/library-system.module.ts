import { Module } from '@nestjs/common';
import { LibraryBookModule } from './library-book/library-book.module';
import { BookTransactionsModule } from './book-transactions/book-transactions.module';
import { BookCategoriesModule } from './book-categories/book-categories.module';

@Module({
    imports: [
        LibraryBookModule,
        BookTransactionsModule,
        BookCategoriesModule,
    ],
})
export class LibrarySystemModule {}
