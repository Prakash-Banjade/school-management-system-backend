import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryBook } from './entities/library-book.entity';
import { Brackets, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class LibraryBookService {
  constructor(
    @InjectRepository(LibraryBook) private libraryBookRepo: Repository<LibraryBook>,
  ) { }

  async create(createLibraryBookDto: CreateLibraryBookDto) {
    const libraryBook = this.libraryBookRepo.create(createLibraryBookDto);
    await this.libraryBookRepo.save(libraryBook);
    return libraryBook;
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.libraryBookRepo.createQueryBuilder('libraryBook');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy("libraryBook.createdAt", queryDto.order)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(libraryBook.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, queryBuilder)
  }

  async findOne(id: string) {
    const existing = await this.libraryBookRepo.findOne({
      where: { id }
    })
    if (!existing) throw new NotFoundException('Library book not found')

    return existing;
  }

  async update(id: string, updateLibraryBookDto: UpdateLibraryBookDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, updateLibraryBookDto);
    return this.libraryBookRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return this.libraryBookRepo.remove(existing);
  }
}
