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
import { BranchesService } from 'src/branches/branches.service';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable()
export class LibraryBookService {
  constructor(
    @InjectRepository(LibraryBook) private libraryBookRepo: Repository<LibraryBook>,
    private readonly bookCategoriesService: BookCategoriesService,
    private readonly utilitiesService: UtilitiesService,
    private readonly branchesService: BranchesService
  ) { }

  async create(createLibraryBookDto: CreateLibraryBookDto) {
    const existingWithSameCode = await this.libraryBookRepo.findOne({ where: { bookCode: createLibraryBookDto.bookCode?.trim() }, select: { id: true } });
    if (existingWithSameCode) throw new ConflictException('Book code already exists');

    const category = await this.bookCategoriesService.findOne(createLibraryBookDto.categoryId);

    const libraryBook = this.libraryBookRepo.create({
      ...createLibraryBookDto,
      category,
      branch: await this.branchesService.getBranch(this.utilitiesService.getBranchId())
    });
    await this.libraryBookRepo.save(libraryBook);

    return { message: 'Library book added' }
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
          qb.andWhere(new Brackets(subQb => {
            subQb.orWhere("LOWER(libraryBook.bookName) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
              .orWhere("TRIM(libraryBook.bookCode) = TRIM(:exactSearch)", { exactSearch: queryDto.search });
          }))
        }

        queryDto.categories?.length && qb.andWhere("category.name IN (:...categories)", { categories: queryDto.categories });
      }))

    this.utilitiesService.applyBranchFilter(queryBuilder, 'libraryBook.branchId = :branchId');
    applySelectColumns(queryBuilder, libraryBookRequestSelectCols, 'libraryBook');

    return paginatedData(queryDto, queryBuilder)
  }

  async findOne(id: string) {
    const existing = await this.libraryBookRepo.findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      relations: {
        category: true,
      },
      select: {
        category: {
          id: true,
          name: true,
        }
      }
    })
    if (!existing) throw new NotFoundException('Library book not found')

    return existing;
  }

  async update(id: string, dto: UpdateLibraryBookDto) {
    const existing = await this.findOne(id);

    if (dto.categoryId && (existing.category?.id !== dto.categoryId || !existing.category)) {
      existing.category = await this.bookCategoriesService.findOne(dto.categoryId);
    }

    if (dto.copiesCount !== undefined && dto.copiesCount < existing.issuedCount) {
      throw new ConflictException(`${existing.issuedCount} copies are already issued. You can't reduce copies count than ${existing.issuedCount}`);
    }

    Object.assign(existing, dto);
    await this.libraryBookRepo.save(existing);

    return { message: 'Library book updated' }
  }

  async updateCount(book: LibraryBook, type: 'issued' | 'returned') {
    book.issuedCount += type === 'issued' ? 1 : -1;
    await this.libraryBookRepo.save(book);
  }

  async remove(id: string) {
    await this.libraryBookRepo.delete({ id });

    return { message: 'Library book deleted' };
  }
}
