import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';
import { SubjectChapter } from './entities/subject-chapter.entity';
import { CreateSubjectChapterDto, SubjectChapterQueryDto, UpdateChapterNoDto, UpdateSubjectChapterDto } from './dto/subject-chapter.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { subjectChapterSelectCols } from './helpers/subject-chapter-select-colst';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectChaptersService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    ) {
        super(dataSource, req);
    }

    async create(createSubjectChapterDto: CreateSubjectChapterDto) {
        const subject = await this.getRepository(Subject).findOne({ where: { id: createSubjectChapterDto.subjectId }, select: { id: true } });
        if (!subject) throw new NotFoundException('Subject not found');

        const lastChapter = await this.getRepository(SubjectChapter).findOne({
            where: { subject: { id: subject.id } },
            order: { chapterNo: 'DESC' },
            select: { chapterNo: true }
        });

        const newSubjectChapter = this.getRepository(SubjectChapter).create({
            ...createSubjectChapterDto,
            subject,
            chapterNo: lastChapter ? lastChapter.chapterNo + 1 : 1
        });
        const savedChapter = await this.getRepository(SubjectChapter).save(newSubjectChapter);

        return this.subjectChapterMutationReturn(savedChapter, 'created');

    }

    async findAll(queryDto: SubjectChapterQueryDto) {
        const queryBuilder = this.getRepository(SubjectChapter).createQueryBuilder('subjectChapter');

        queryBuilder
            .skip(queryDto.skip)
            .take(queryDto.take)
            .orderBy("subjectChapter.chapterNo", "ASC")
            .withDeleted()
            .leftJoinAndSelect('subjectChapter.subject', 'subject')
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(subjectChapter.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId })
            }))

        applySelectColumns(queryBuilder, subjectChapterSelectCols, 'subjectChapter');

        return paginatedData(queryDto, queryBuilder);
    }

    async findOne(id: string) {
        const existing = await this.getRepository(SubjectChapter).findOne({
            where: { id },
            relations: {
                subject: true, // used in remove method
            },
            select: {
                subject: {
                    id: true,
                    subjectName: true,
                }
            }
        })
        if (!existing) throw new NotFoundException(`Subject chapter with id ${id} not found`);

        return existing
    }

    async update(id: string, updateSubjectChapterDto: UpdateSubjectChapterDto) {
        const existing = await this.findOne(id);

        Object.assign(existing, updateSubjectChapterDto);

        const updatedSubjectChapter = await this.getRepository(SubjectChapter).save(existing);
        return this.subjectChapterMutationReturn(updatedSubjectChapter, 'updated');
    }

    async updateChapterNo(updateChapterNoDto: UpdateChapterNoDto) {
        // TODO: validate chapters, if the chapter No is in correct sequence
        const savedChapters = await this.getRepository(SubjectChapter).save(updateChapterNoDto.chapters);

        if (savedChapters.length === 0) {
            throw new BadRequestException('No chapters were updated');
        }

        return {
            message: 'Chapters updated',
        }
    }

    async remove(id: string) {
        const existing = await this.findOne(id);
        const deletedChapter = await this.getRepository(SubjectChapter).remove(existing);

        // update chapter no of next chapters
        await this.getRepository(SubjectChapter).createQueryBuilder()
            .update(SubjectChapter)
            .set({
                chapterNo: () => "chapterNo - 1"
            })
            .where("subjectId = :subjectId AND chapterNo > :chapterNo", { subjectId: existing.subject.id, chapterNo: existing.chapterNo }) // update the chapter no of next chapters of associated subject
            .execute();

        return this.subjectChapterMutationReturn(deletedChapter, 'deleted')
    }

    private subjectChapterMutationReturn = (subjectChapter: SubjectChapter, type: 'created' | 'updated' | 'deleted') => {
        return {
            message: type === 'created' ? 'Chapter created' : type === 'deleted' ? 'Chapter deleted' : 'Chapter updated',
            subjectChapter: {
                id: subjectChapter.id,
            }
        }
    }
}
