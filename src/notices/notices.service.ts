import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';
import { Brackets, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice) private readonly noticeRepo: Repository<Notice>,
  ) { }

  async create(createNoticeDto: CreateNoticeDto) {

    const newNotice = this.noticeRepo.create({
      ...createNoticeDto,
    })

    const saved = await this.noticeRepo.save(newNotice);

    return {
      message: 'Notice created successfully',
      id: saved.id,
    }
  }

  async findAll(queryDto: QueryDto) {
    const querybuilder = this.noticeRepo.createQueryBuilder('notice');

    querybuilder
      .orderBy('notice.createdAt', 'DESC')
      .take(queryDto.take)
      .skip(queryDto.skip)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere('LOWER(notice.title) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
      }))
      .select([
        'notice.id',
        'notice.title',
        'notice.createdAt',
        'notice.updatedAt',
      ])

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existingNotice = await this.noticeRepo.findOne({
      where: {
        id
      }
    });

    if (!existingNotice) throw new NotFoundException('Notice not found');

    return existingNotice;
  }

  async update(id: string, updateNoticeDto: UpdateNoticeDto) {
    const existingNotice = await this.findOne(id);

    Object.assign(existingNotice, updateNoticeDto);

    const saved = await this.noticeRepo.save(existingNotice);

    return {
      message: 'Notice updated successfully',
      id: saved.id,
    }
  }

  async remove(id: string) {
    const existingNotice = await this.findOne(id);
    await this.noticeRepo.remove(existingNotice);

    return {
      message: 'Notice removed successfully',
    }
  }
}
