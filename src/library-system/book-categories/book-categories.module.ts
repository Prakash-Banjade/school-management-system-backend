import { Module } from '@nestjs/common';
import { BookCategoriesService } from './book-categories.service';
import { BookCategoriesController } from './book-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookCategory } from './entities/book-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookCategory,
    ])
  ],
  controllers: [BookCategoriesController],
  providers: [BookCategoriesService],
  exports: [BookCategoriesService],
})
export class BookCategoriesModule {}
