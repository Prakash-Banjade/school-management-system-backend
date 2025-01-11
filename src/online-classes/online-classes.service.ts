import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { UpdateOnlineClassDto } from './dto/update-online-class.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { EOnlineClassStatus, OnlineClass } from './entities/online-class.entity';
import { OnlineClassQueryDto } from './dto/online-class-query.dto';
import { paginatedRawData } from 'src/utils/paginatedData';
import { EClassType } from 'src/common/types/global.type';

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

    const classRoom = await this.getRepository(ClassRoom).findOne({ // this can be a primary or section class
      where: { id: dto.classRoomId, branch: { id: branchId } },
      relations: { children: true },
      select: { id: true, classType: true, parent: { id: true } }
    });
    if (!classRoom) throw new NotFoundException('Class room not found');

    const subject = await this.getRepository(Subject).findOne({
      where: { id: dto.subjectId, classRoom: { id: classRoom.classType === EClassType.PRIMARY ? classRoom.id : classRoom.parent?.id } }, // subjects are always in primary class
      select: { id: true }
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const newOnlineClass = this.getRepository(OnlineClass).create({
      ...dto,
      teacher,
      classRoom,
      subject,
      status: !!dto.scheduleDate ? EOnlineClassStatus.Scheduled : EOnlineClassStatus.Live,
      joinLink: 'this is join link',
    });

    await this.getRepository(OnlineClass).save(newOnlineClass);

    return {
      message: !dto.scheduleDate ? 'Online class created' : 'Online class is scheduled successfully',
    };
  }

  findAll(queryDto: OnlineClassQueryDto) {
    const queryBuilder = this.getRepository(OnlineClass).createQueryBuilder('onlineClass');

    queryBuilder
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .orderBy('onlineClass.createdAt', queryDto.order)
      .leftJoin('onlineClass.teacher', 'teacher')
      .leftJoin('onlineClass.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('onlineClass.subject', 'subject')
      .where(new Brackets(qb => {
        queryDto.teacherId && qb.andWhere('teacher.id = :teacherId', { teacherId: queryDto.teacherId });
        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
      }))
      .select([
        'onlineClass.id as id',
        'onlineClass.title as title',
        'onlineClass.status as status',
        'onlineClass.scheduleDate as scheduleDate',
        'onlineClass.joinLink as joinLink',
        'CONCAT(teacher.firstName, " ", teacher.lastName) as teacherName',
        'subject.subjectName as subjectName',
        'CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, " - ", classRoom.name) END as classRoomName',
      ]);

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(OnlineClass).findOne({
      where: { id },
      relations: { teacher: true, classRoom: true, subject: true },
      select: {
        teacher: {
          id: true,
          firstName: true,
          lastName: true,
        },
        classRoom: {
          id: true,
          name: true,
        },
        subject: {
          id: true,
          subjectName: true,
        },
      }
    });

    if (!existing) throw new NotFoundException('Online class not found');

    return existing;
  }

  async update(id: string, dto: UpdateOnlineClassDto) {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const existing = await this.getRepository(OnlineClass).findOne({
      where: {
        id,
        teacher: { account: { id: accountId } }
      },
      select: { id: true }
    });

    if (!existing) throw new NotFoundException('Online class not found');

    await this.getRepository(OnlineClass).update({ id }, dto);

    return { message: 'Online class updated' };
  }

  async remove(id: string) {
    const { accountId } = this.utilitiesService.getCurrentUser();

    await this.getRepository(OnlineClass).delete({
      id,
      teacher: { account: { id: accountId } }
    });

    return { message: 'Online class deleted' };
  }
}
