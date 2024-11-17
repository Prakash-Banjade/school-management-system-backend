import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { FilesService } from 'src/file-management/files/files.service';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { LessonPlan } from './entities/lesson-plan.entity';
import { AuthUser, Role } from 'src/common/types/global.type';
import { LessonPlanQueryDto } from './dto/lesson-plan-query.dto';
import { isStudent } from 'src/utils/isStudent';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { lessonPlanSelectCols } from './helpers/lesson-plan-select-cols';
import { paginatedRawData } from 'src/utils/paginatedData';

@Injectable({ scope: Scope.REQUEST })
export class LessonPlansService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    private readonly filesService: FilesService,
  ) { super(datasource, req); }

  async create(dto: CreateLessonPlanDto, currentUser: AuthUser) {
    const account = await this.getRepository(Account).findOneBy({ id: currentUser.accountId });

    const attachments = dto.attachmentIds?.length
      ? await this.filesService.findAllByIds(dto.attachmentIds)
      : null;

    // validate if class room have the subject
    const classRoomWithSubject = await this.getRepository(ClassRoom).createQueryBuilder('classRoom')
      .leftJoin('classRoom.subjects', 'subject')
      .leftJoin('classRoom.children', 'children')
      .where('subject.id = :subjectId', { subjectId: dto.subjectId })
      .select(['classRoom.id', 'subject.id', 'children.id'])
      .getOne();

    if (!classRoomWithSubject || !classRoomWithSubject.subjects[0]) throw new NotFoundException('No class found or the subject is not in the class')

    const classRoomsTheLessonPlanFor = dto.classRoomIds?.length > 1 // if length is greater than one, then class room must be of type section, so we need to get children
      ? classRoomWithSubject.children?.filter(classRoom => dto.classRoomIds.includes(classRoom.id)) // getting only those childrens which has a match in classRoomIds
      : classRoomWithSubject.id === dto.classRoomIds[0] // check if the classRoomIds[0](can be primary class) is equal to the classRoomWithSubject
        ? [classRoomWithSubject]
        : [classRoomWithSubject.children?.find(classRoom => classRoom.id === dto.classRoomIds[0])].filter(Boolean); // At this stage, it is guaranteed that the classRoomIds[0] is a child of the classRoomWithSubject;

    if (!classRoomsTheLessonPlanFor?.length) throw new NotFoundException('Class room not found with subject');

    const newLessonPlan = this.getRepository(LessonPlan).create({
      ...dto,
      subject: classRoomWithSubject.subjects[0],
      classRooms: classRoomsTheLessonPlanFor,
      attachments,
      createdBy: account,
    });

    await this.getRepository(LessonPlan).save(newLessonPlan);

    return { message: 'Lesson plan created' };
  }

  findAll(queryDto: LessonPlanQueryDto, currentUser: AuthUser) {
    const queryBuilder = this.getRepository(LessonPlan).createQueryBuilder('lessonPlan');

    const classRoomId = isStudent(currentUser) ? currentUser.classRoomId : queryDto.classRoomId;
    const sectionId = isStudent(currentUser) ? currentUser.classRoomId : queryDto.sectionId;

    queryBuilder
      .orderBy("lessonPlan.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('lessonPlan.subject', 'subject')
      .leftJoin('lessonPlan.classRooms', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('lessonPlan.createdBy', 'createdBy')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(lessonPlan.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });

        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR parent.id = :classRoomId', { classRoomId: sectionId ?? classRoomId }); // check in both section and class

        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
      }))
      .select([
        "lessonPlan.id as id",
        "lessonPlan.title as title",
        "lessonPlan.startDate as startDate",
        "lessonPlan.endDate as endDate",
        "lessonPlan.createdBy as createdBy",
        "subject.subjectName as subjectName",
        "JSON_ARRAYAGG(classRoom.name) as classRooms", // Aggregate classrooms as JSON
        "MAX(parent.name) as parentClassName",
        "CONCAT(createdBy.firstName, ' ', createdBy.lastName) as createdByName",
      ])
      .groupBy("lessonPlan.id")

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(LessonPlan).findOne({
      where: { id },
      relations: {
        subject: true,
        createdBy: true,
        attachments: true,
        classRooms: {
          parent: true
        }
      },
      select: lessonPlanSelectCols,
    });

    if (!existing) throw new NotFoundException('Lesson plan not found');

    return existing;
  }

  async update(id: string, updateLessonPlanDto: UpdateLessonPlanDto) {
    const existing = await this.findOne(id);

  }

  async remove(id: string) {
    const existing = await this.getRepository(LessonPlan).findOne({
      where: { id },
      select: { id: true }
    });
    if (!existing) throw new NotFoundException('Lesson plan not found');

    await this.getRepository(LessonPlan).remove(existing);

    return { message: 'Lesson plan deleted' };
  }
}
