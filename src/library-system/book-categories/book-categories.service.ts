import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { CreateBookCategoryDto } from './dto/create-book-category.dto';
import { UpdateBookCategoryDto } from './dto/update-book-category.dto';
import { BookCategory } from './entities/book-category.entity';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class BookCategoriesService {
  constructor(
    @InjectRepository(BookCategory)
    private readonly bookCategoryRepository: Repository<BookCategory>,
  ) { }

  async create(createBookCategoryDto: CreateBookCategoryDto) {
    const existingCategory = await this.bookCategoryRepository.findOne({ where: { name: createBookCategoryDto.name } });
    if (existingCategory) throw new ConflictException('Book category with this name already exists');

    const category = this.bookCategoryRepository.create(createBookCategoryDto);
    const savedCategory = await this.bookCategoryRepository.save(category);

    return this.bookCategoryMutationReturn(savedCategory, 'created');
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.bookCategoryRepository.createQueryBuilder('bookCategory');
    queryBuilder
      .orderBy("bookCategory.createdAt", queryDto.order)
      .skip(queryDto.skipPagination ? undefined : queryDto.skip)
      .take(queryDto.skipPagination ? undefined : queryDto.take)
      .loadRelationCountAndMap('bookCategory.booksCount', 'bookCategory.books')
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(bookCategory.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select(['bookCategory.id', 'bookCategory.name']);

    return paginatedData(queryDto, queryBuilder);
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

    const existingWithSameName = await this.bookCategoryRepository.findOne({ where: { name: updateBookCategoryDto.name, id: Not(existingCategory.id) } });
    if (existingWithSameName) throw new ConflictException('Book category with same name already exists');

    Object.assign(existingCategory, updateBookCategoryDto);
    const savedCategory = await this.bookCategoryRepository.save(existingCategory);

    return this.bookCategoryMutationReturn(savedCategory, 'updated');
  }

  async remove(id: string) {
    const existingCategory = await this.findOne(id);
    await this.bookCategoryRepository.remove(existingCategory);

    return this.bookCategoryMutationReturn(existingCategory, 'deleted');
  }

  private bookCategoryMutationReturn = (category: BookCategory, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Book category created successfully' : type === 'deleted' ? 'Book category deleted successfully' : 'Book category updated successfully',
      category: {
        id: category.id,
        name: category.name,
      }
    }
  }
}
