import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { SubjectChapter } from './entities/subject-chapter.entity';
import { CreateSubjectChapterDto, UpdateSubjectChapterDto } from './dto/subject-chapter.dto';
import { SubjectsService } from './subjects.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { AuthUser } from 'src/common/types/global.type';

@Injectable()
export class SubjectChaptersService {
    constructor(
        @InjectRepository(SubjectChapter) private readonly subjectChaptersRepo: Repository<SubjectChapter>,
        private readonly subjectsService: SubjectsService,
    ) { }

    async create(createSubjectChapterDto: CreateSubjectChapterDto, currentUser: AuthUser) {
        const subject = await this.subjectsService.findOne(createSubjectChapterDto.subjectId, currentUser);

        const newSubjectChapter = this.subjectChaptersRepo.create({
            ...createSubjectChapterDto,
            subject
        });
        const savedChapter = await this.subjectChaptersRepo.save(newSubjectChapter);

        return this.subjectChapterMutationReturn(savedChapter, 'created');

    }

    async findAll(queryDto: QueryDto) {
        const queryBuilder = this.subjectChaptersRepo.createQueryBuilder('subjectChapter');

        queryBuilder
            .skip(queryDto.skip)
            .take(queryDto.take)
            .orderBy("subjectChapter.createdAt", queryDto.order)
            .withDeleted()
            .leftJoinAndSelect('subjectChapter.subject', 'subject')
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(subjectChapter.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
            }))

        // TODO: add select cols

        return paginatedData(queryDto, queryBuilder);
    }

    async findOne(id: string) {
        const existing = await this.subjectChaptersRepo.findOne({
            where: { id },
            relations: {
                subject: {
                    classRoom: true,
                    teacher: true
                },
            }
        })
        if (!existing) throw new NotFoundException(`SubjectChapter with id ${id} not found`);

        return existing
    }

    async update(id: string, updateSubjectChapterDto: UpdateSubjectChapterDto) {
        const existing = await this.findOne(id);

        Object.assign(existing, updateSubjectChapterDto);

        const updatedSubjectChapter = await this.subjectChaptersRepo.save(existing);
        return this.subjectChapterMutationReturn(updatedSubjectChapter, 'updated');
    }

    async remove(id: string) {
        const existing = await this.findOne(id);
        const deletedSubjectChapter = await this.subjectChaptersRepo.softRemove(existing);

        return this.subjectChapterMutationReturn(deletedSubjectChapter, 'deleted')
    }

    private subjectChapterMutationReturn = (subjectChapter: SubjectChapter, type: 'created' | 'updated' | 'deleted') => {
        return {
            message: type === 'created' ? 'SubjectChapter created successfully' : 'SubjectChapter updated successfully',
            subjectChapter: {
                id: subjectChapter.id,
                title: subjectChapter.title,
                chapterNo: subjectChapter.chapterNo,
            }
        }
    }
}
