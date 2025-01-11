import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { UpdateOnlineClassDto } from './dto/update-online-class.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { EOnlineClassStatus, OnlineClass } from './entities/online-class.entity';
import { OnlineClassQueryDto } from './dto/online-class-query.dto';

@Injectable()
export class OnlineClassesService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    private readonly utilitiesService: UtilitiesService,
  ) { super(dataSource, req) }

  async create(dto: CreateOnlineClassDto) {
    const { accountId, branchId } = this.utilitiesService.getCurrentUser();

    const teacher = await this.getRepository(Teacher).findOne({ where: { account: { id: accountId } }, select: { id: true } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const classRoom = await this.getRepository(ClassRoom).findOne({ where: { id: dto.classRoomId, branch: { id: branchId } }, select: { id: true } });

    const subject = await this.getRepository(Subject).findOne({ where: { id: dto.subjectId, classRoom: { id: classRoom.id } }, select: { id: true } });

    const newOnlineClass = this.getRepository(OnlineClass).create({
      ...dto,
      teacher,
      classRoom,
      subject,
      status: !!dto.scheduledAt ? EOnlineClassStatus.Scheduled : EOnlineClassStatus.Live,
      joinLink: 'this is join link',
    });

    await this.getRepository(OnlineClass).save(newOnlineClass);

    return {
      message: !dto.scheduledAt ? 'Online class created' : 'Online class is scheduled successfully',
    };
  }

  findAll(queryDto: OnlineClassQueryDto) {
    const queryBuilder = this.getRepository(OnlineClass).createQueryBuilder('onlineClass')
  }

  findOne(id: string) {
    return `This action returns a #${id} onlineClass`;
  }

  update(id: string, updateOnlineClassDto: UpdateOnlineClassDto) {
    return `This action updates a #${id} onlineClass`;
  }

  remove(id: string) {
    return `This action removes a #${id} onlineClass`;
  }
}
