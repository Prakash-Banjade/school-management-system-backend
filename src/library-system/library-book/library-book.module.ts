import { Module } from '@nestjs/common';
import { LibraryBookService } from './library-book.service';
import { LibraryBookController } from './library-book.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryBook } from './entities/library-book.entity';
import { BookCategoriesModule } from '../book-categories/book-categories.module';
import { LibraryHelper } from './helpers/library.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LibraryBook,
    ]),
    BookCategoriesModule,
  ],
  controllers: [LibraryBookController],
  providers: [LibraryBookService, LibraryHelper],
  exports: [LibraryBookService],
})
export class LibraryBookModule { }
