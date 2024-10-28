import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryBook } from './entities/library-book.entity';
import { Brackets, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { libraryBookRequestSelectCols } from './helpers/library-book-request-select-cols';

@Injectable()
export class LibraryBookService {
  constructor(
    @InjectRepository(LibraryBook) private libraryBookRepo: Repository<LibraryBook>,
  ) { }

  async create(createLibraryBookDto: CreateLibraryBookDto) {
    const existingWithSameCode = await this.libraryBookRepo.findOne({ where: { bookCode: createLibraryBookDto.bookCode } });
    if (existingWithSameCode) throw new ConflictException('Book code already exists');

    const libraryBook = this.libraryBookRepo.create(createLibraryBookDto);
    const saved = await this.libraryBookRepo.save(libraryBook);

    return this.libraryBookMutationReturn(saved, 'created');
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.libraryBookRepo.createQueryBuilder('libraryBook');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy("libraryBook.createdAt", queryDto.order)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere(new Brackets(qb => {
          qb.orWhere("LOWER(libraryBook.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });
          qb.orWhere("libraryBook.bookCode = :search", { search: queryDto.search });
        }))
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

  async incrementIssuedCount(book: LibraryBook) {
    book.issuedCount++;
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
