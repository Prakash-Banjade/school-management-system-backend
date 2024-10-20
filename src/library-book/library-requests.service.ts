import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { LibraryBookRequest } from './entities/library-book-request.entity';
import { CreateLibraryBookRequestDto, UpdateLibraryBookRequestDto } from './dto/create-library-book-request.dto';
import { LibraryBookService } from './library-book.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { ELibarryBookStatus } from 'src/common/types/global.type';

@Injectable()
export class LibraryBookRequestService {
    constructor(
        @InjectRepository(LibraryBookRequest) private libraryBookRequestRepo: Repository<LibraryBookRequest>,
        private readonly accountsService: AccountsService,
        private readonly libraryBookService: LibraryBookService,
    ) { }

    async create(createLibraryBookRequestDto: CreateLibraryBookRequestDto) {
        const libraryBook = await this.libraryBookService.findOne(createLibraryBookRequestDto.libraryBookId);
        const account = await this.accountsService.findOne(createLibraryBookRequestDto.accountId);

        const newLibraryBookRequest = this.libraryBookRequestRepo.create({
            ...createLibraryBookRequestDto,
            libraryBook,
            account,
        })

        const savedLibraryBookRequest = await this.libraryBookRequestRepo.save(newLibraryBookRequest);

        // UPDATE THE BOOK AVAILABILITY
        await this.libraryBookService.update(createLibraryBookRequestDto.libraryBookId, {
            available: false
        })

        return savedLibraryBookRequest;
    }

    async findAll(queryDto: QueryDto) {
        const queryBuilder = this.libraryBookRequestRepo.createQueryBuilder('libraryBookRequest');

        queryBuilder
            .skip(queryDto.skip)
            .take(queryDto.take)
            .orderBy("libraryBookRequest.createdAt", queryDto.order)
            .where(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(libraryBookRequest.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
            }))

        return paginatedData(queryDto, queryBuilder)
    }

    async findOne(id: string) {
        const existing = await this.libraryBookRequestRepo.findOne({
            where: { id },
            relations: {
                libraryBook: true,
            }
        })
        if (!existing) throw new NotFoundException('Library book not found')

        return existing;
    }

    async update(id: string, updateLibraryBookRequestDto: UpdateLibraryBookRequestDto) {
        const existing = await this.findOne(id);
        Object.assign(existing, updateLibraryBookRequestDto);

        // UPDATE THE BOOK AVAILABILITY
        if (updateLibraryBookRequestDto.status === ELibarryBookStatus.RETURNED) {
            await this.libraryBookService.update(existing.libraryBook.id, {
                available: true
            })
        }

        return this.libraryBookRequestRepo.save(existing);
    }

    async remove(id: string) {
        const existing = await this.findOne(id);

        // UPDATE THE BOOK AVAILABILITY
        if (existing.libraryBook?.id) {
            await this.libraryBookService.update(existing.libraryBook.id, {
                available: true
            })
        }

        return this.libraryBookRequestRepo.remove(existing);
    }
}
