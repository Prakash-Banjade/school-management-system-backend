import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryBook } from './entities/library-book.entity';
import { Brackets, DataSource, ILike, Repository } from 'typeorm';
import paginatedData from 'src/utils/paginatedData';
import { LibraryBookQueryDto } from './dto/library-book.query.dto';
import { BookCategoriesService } from '../book-categories/book-categories.service';
import { BranchesService } from 'src/branches/branches.service';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { FilesService } from 'src/file-management/files/files.service';
import { EFileMimeType } from 'src/common/types/global.type';
import { isAdmin } from 'src/utils/utils';
import { ImagesService } from 'src/file-management/images/images.service';
import { libraryBookSelectCols } from './helpers/library-book-request-select-cols';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

@Injectable()
export class LibraryBookService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly bookCategoriesService: BookCategoriesService,
    private readonly utilitiesService: UtilitiesService,
    private readonly branchesService: BranchesService,
    private readonly filesService: FilesService,
    private readonly imagesService: ImagesService,
  ) { super(datasource, req) }

  async create(createLibraryBookDto: CreateLibraryBookDto) {
    const existingWithSameCode = await this.getRepository(LibraryBook).findOne({ where: { bookCode: ILike(createLibraryBookDto.bookCode?.trim()) }, select: { id: true } });
    if (existingWithSameCode) throw new ConflictException('Book code already exists');

    const category = await this.bookCategoriesService.findOne(createLibraryBookDto.categoryId);

    const documents = createLibraryBookDto.documentIds?.length
      ? await this.filesService.findAllByIds(createLibraryBookDto.documentIds, [EFileMimeType.PDF, EFileMimeType.Audio])
      : [];

    const coverImage = createLibraryBookDto.coverImageId
      ? await this.imagesService.findOne(createLibraryBookDto.coverImageId)
      : null;

    const libraryBook = this.getRepository(LibraryBook).create({
      ...createLibraryBookDto,
      category,
      branch: await this.branchesService.getBranch(this.utilitiesService.getBranchId()),
      documents,
      coverImage
    });
    await this.getRepository(LibraryBook).save(libraryBook);

    return { message: 'Library book added' }
  }

  async findAll(queryDto: LibraryBookQueryDto) {
    const queryBuilder = this.getRepository(LibraryBook).createQueryBuilder('libraryBook');
    const currentUser = this.utilitiesService.getCurrentUser();

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy("libraryBook.createdAt", queryDto.order)
      .leftJoin("libraryBook.category", "category")
      .leftJoin("libraryBook.coverImage", "coverImage")
      .where(new Brackets(qb => {
        if (queryDto.search) {
          qb.andWhere(new Brackets(subQb => {
            subQb.orWhere("LOWER(libraryBook.bookName) LIKE :search", { search: `%${queryDto.search.toLowerCase()}%` })
              .orWhere("libraryBook.publisherName LIKE :search", { search: `%${queryDto.search.toLowerCase()}%` })
              .orWhere("libraryBook.bookCode = :exactSearch", { exactSearch: queryDto.search })
          }))
        }

        queryDto.categories?.length && qb.andWhere("category.name IN (:...categories)", { categories: queryDto.categories });
      }))
      .select([
        'libraryBook.id',
        'libraryBook.createdAt',
        'libraryBook.bookCode',
        'libraryBook.bookName',
        'libraryBook.publisherName',
        'libraryBook.description',
        'libraryBook.publicationYear',
        'category.id',
        'category.name',
        'coverImage.id',
        'coverImage.url',
        'coverImage.originalName',
      ]);

    if (isAdmin(currentUser)) { // necessary only for admin
      queryBuilder
        .leftJoin("libraryBook.documents", "documents")
        .addSelect([
          'documents.id',
          'documents.url',
          'documents.originalName',
          'libraryBook.copiesCount',
          'libraryBook.issuedCount',
        ])
    }

    this.utilitiesService.applyBranchFilter(queryBuilder, 'libraryBook.branchId = :branchId');

    return paginatedData(queryDto, queryBuilder)
  }

  async findOne(id: string) {
    const currentUser = this.utilitiesService.getCurrentUser();

    const existing = await this.getRepository(LibraryBook).findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      relations: {
        category: true,
        documents: true,
        coverImage: true
      },
      select: {
        ...libraryBookSelectCols,
        ...(isAdmin(currentUser) ? {
          copiesCount: true,
          issuedCount: true,
        } : {})
      }
    })
    if (!existing) throw new NotFoundException('Library book not found')

    return existing;
  }

  async update(id: string, dto: UpdateLibraryBookDto) {
    const existing = await this.getRepository(LibraryBook).findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      relations: { category: true, coverImage: true },
      select: {
        id: true,
        issuedCount: true,
        copiesCount: true,
        bookCode: true,
        category: { id: true },
        coverImage: { id: true },
      }
    });

    if (!existing) throw new NotFoundException('Library book not found');

    // check if code is taken
    if (dto.bookCode && dto.bookCode !== existing.bookCode) {
      const existingWithSameCode = await this.getRepository(LibraryBook).findOne({ where: { bookCode: ILike(dto.bookCode.trim()) }, select: { id: true } });
      if (existingWithSameCode) throw new ConflictException('Book code already exists');
    }

    // check if category is changed
    if (dto.categoryId && (existing.category?.id !== dto.categoryId || !existing.category)) {
      existing.category = await this.bookCategoriesService.findOne(dto.categoryId);
    }

    // check if copies count is reduced
    if (dto.copiesCount !== undefined && dto.copiesCount < existing.issuedCount) {
      throw new BadRequestException({
        message: `${existing.issuedCount} copies are already issued. You can't reduce copies count than ${existing.issuedCount}`,
        field: 'copiesCount'
      });
    }

    const documents = await this.filesService.findAllByIds(dto.documentIds, [EFileMimeType.PDF, EFileMimeType.Audio]);
    existing.documents = documents;

    // check if cover image is changed
    const image = await this.imagesService.update(existing.coverImage?.id, dto.coverImageId);
    if (image !== undefined) existing.coverImage = image;

    Object.assign(existing, dto);
    await this.getRepository(LibraryBook).save(existing);

    return { message: 'Library book updated' }
  }

  async updateCount(book: LibraryBook, type: 'issued' | 'returned') {
    book.issuedCount += type === 'issued' ? 1 : -1;
    await this.getRepository(LibraryBook).save(book);
  }

  async remove(id: string) {
    await this.getRepository(LibraryBook).delete({ id });

    return { message: 'Library book deleted' };
  }
}
