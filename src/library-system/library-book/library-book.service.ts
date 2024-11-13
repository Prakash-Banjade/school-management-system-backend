import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryBook } from './entities/library-book.entity';
import { Brackets, Repository } from 'typeorm';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { libraryBookRequestSelectCols } from './helpers/library-book-request-select-cols';
import { LibraryBookQueryDto } from './dto/library-book.query.dto';
import { BookCategoriesService } from '../book-categories/book-categories.service';

@Injectable()
export class LibraryBookService {
  constructor(
    @InjectRepository(LibraryBook) private libraryBookRepo: Repository<LibraryBook>,
    private readonly bookCategoriesService: BookCategoriesService,
  ) { }

  async create(createLibraryBookDto: CreateLibraryBookDto) {
    const existingWithSameCode = await this.libraryBookRepo.findOne({ where: { bookCode: createLibraryBookDto.bookCode?.trim() } });
    if (existingWithSameCode) throw new ConflictException('Book code already exists');

    const category = await this.bookCategoriesService.findOne(createLibraryBookDto.categoryId);

    const libraryBook = this.libraryBookRepo.create({
      ...createLibraryBookDto,
      category,
    });
    const saved = await this.libraryBookRepo.save(libraryBook);

    return this.libraryBookMutationReturn(saved, 'created');
  }

  async findAll(queryDto: LibraryBookQueryDto) {
    const queryBuilder = this.libraryBookRepo.createQueryBuilder('libraryBook');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy("libraryBook.createdAt", queryDto.order)
      .leftJoin("libraryBook.category", "category")
      .where(new Brackets(qb => {
        if (queryDto.search) {
          qb.andWhere(new Brackets(qb => {
            qb.orWhere("libraryBook.bookCode = :search", { search: queryDto.search });
            qb.orWhere("LOWER(libraryBook.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });
          }))
        }

        queryDto.categories?.length && qb.andWhere("category.name IN (:...categories)", { categories: queryDto.categories });
      }))

    applySelectColumns(queryBuilder, libraryBookRequestSelectCols, 'libraryBook');

    return paginatedData(queryDto, queryBuilder)
  }

  async findOne(id: string) {
    const existing = await this.libraryBookRepo.findOne({
      where: { id },
    })
    if (!existing) throw new NotFoundException('Library book not found')

    return existing;
  }

  async update(id: string, updateLibraryBookDto: UpdateLibraryBookDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, updateLibraryBookDto);
    await this.libraryBookRepo.save(existing);

    return this.libraryBookMutationReturn(existing, "updated")
  }

  async updateCount(book: LibraryBook, type: 'issued' | 'returned') {
    book.issuedCount += type === 'issued' ? 1 : -1;
    await this.libraryBookRepo.save(book);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.libraryBookRepo.remove(existing);

    return this.libraryBookMutationReturn(existing, "deleted")
  }

  private libraryBookMutationReturn(libraryBook: LibraryBook, type: 'created' | 'updated' | 'deleted') {
    return {
      message: type === 'created' ? 'Library book created successfully' : type === 'deleted' ? 'Library book deleted successfully' : 'Library book updated successfully',
      libraryBook: {
        id: libraryBook.id,
        name: libraryBook.bookName,
      }
    }
  }
}
