import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';
import { Repository } from 'typeorm';
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

    const savedNotice = await this.noticeRepo.save(newNotice);

    return {
      message: 'Notice created successfully',
      title: savedNotice.title,
    }
  }

  async findAll(queryDto: QueryDto) {
    const querybuilder = this.noticeRepo.createQueryBuilder('notice');

    querybuilder
      .orderBy('notice.createdAt', 'DESC')
      .take(queryDto.take)
      .skip(queryDto.skip);

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

    const savedNotice = await this.noticeRepo.save(existingNotice);

    return {
      message: 'Notice updated successfully',
      title: savedNotice.title,
    }
  }

  async remove(id: string) {
    const existingNotice = await this.findOne(id);
    const removedNotice = await this.noticeRepo.remove(existingNotice);

    return {
      message: 'Notice removed successfully',
      title: removedNotice.title,
    }
  }
}
