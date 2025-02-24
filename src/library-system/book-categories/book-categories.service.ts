import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, ILike, Not, Repository } from 'typeorm';
import { CreateBookCategoryDto } from './dto/create-book-category.dto';
import { UpdateBookCategoryDto } from './dto/update-book-category.dto';
import { BookCategory } from './entities/book-category.entity';
import { QueryDto } from 'src/common/dto/query.dto';
import { paginatedRawData } from 'src/utils/paginatedData';

@Injectable()
export class BookCategoriesService {
  constructor(
    @InjectRepository(BookCategory) private readonly bookCategoryRepository: Repository<BookCategory>,
  ) { }

  async create(createBookCategoryDto: CreateBookCategoryDto) {
    const existingCategory = await this.bookCategoryRepository.findOne({ where: { name: ILike(createBookCategoryDto.name) }, select: { id: true } });
    if (existingCategory) throw new ConflictException('Book category with this name already exists');

    const category = this.bookCategoryRepository.create(createBookCategoryDto);
    await this.bookCategoryRepository.save(category);

    return { message: "Created successfully" }
  }

  async findAll(queryDto: QueryDto, branchId: string | undefined) {
    const queryBuilder = this.bookCategoryRepository.createQueryBuilder('bookCategory');

    queryBuilder.orderBy("bookCategory.createdAt", queryDto.order);

    if (!queryDto.skipPagination) {
      queryBuilder.offset(queryDto.skip).limit(queryDto.take)
    }

    queryBuilder
      .leftJoin(
        'bookCategory.books',
        'books',
        branchId ? 'books.branchId = :branchId' : undefined,
        { branchId }
      )
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(bookCategory.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select([
        'bookCategory.id as id',
        'bookCategory.name as name',
        `COUNT(books.id) as booksCount`
      ])
      .groupBy('bookCategory.id')

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string): Promise<BookCategory> {
    const category = await this.bookCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Book category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateBookCategoryDto: UpdateBookCategoryDto) {
    const existingCategory = await this.findOne(id);

    const existingWithSameName = await this.bookCategoryRepository.findOne({ where: { name: ILike(updateBookCategoryDto.name), id: Not(existingCategory.id) }, select: { id: true } });
    if (existingWithSameName) throw new ConflictException('Book category with same name already exists');

    Object.assign(existingCategory, updateBookCategoryDto);
    await this.bookCategoryRepository.save(existingCategory);

    return { message: "Updated successfully" }
  }

  async remove(id: string) {
    await this.bookCategoryRepository.delete({ id });

    return { message: 'Book category deleted' };
  }
}
