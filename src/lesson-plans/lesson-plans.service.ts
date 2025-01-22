import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto, UpdateLessonPlanStatusDto } from './dto/update-lesson-plan.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource, In } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { FilesService } from 'src/file-management/files/files.service';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { LessonPlan } from './entities/lesson-plan.entity';
import { AuthUser, EClassType } from 'src/common/types/global.type';
import { LessonPlanQueryDto } from './dto/lesson-plan-query.dto';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { lessonPlanSelectCols } from './helpers/lesson-plan-select-cols';
import { paginatedRawData } from 'src/utils/paginatedData';
import { Subject } from '../subjects/entities/subject.entity';
import { isStudent } from 'src/utils/utils';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable({ scope: Scope.REQUEST })
export class LessonPlansService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    private readonly filesService: FilesService,
    private readonly utilitiesService: UtilitiesService
  ) { super(datasource, req); }

  async create(dto: CreateLessonPlanDto, currentUser: AuthUser) {
    const account = await this.getRepository(Account).findOne({ where: { id: currentUser.accountId }, select: { id: true } });

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
      .leftJoin('classRoom.faculty', 'faculty')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('lessonPlan.createdBy', 'createdBy')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(lessonPlan.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });

        queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });

        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR parent.id = :classRoomId', { classRoomId: sectionId ?? classRoomId }); // check in both section and class
        queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // section is the class room

        queryDto.status?.length && qb.andWhere('lessonPlan.status IN (:...status)', { status: queryDto.status });
      }))
      .andWhere(new Brackets(qb => {
        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId }); // needs to put separate in another andWhere clause
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
        "MAX(faculty.name) as facultyName",
        "CONCAT(createdBy.firstName, ' ', createdBy.lastName) as createdByName",
        "lessonPlan.status as status",
      ])
      .groupBy("lessonPlan.id")

    this.utilitiesService.applyBranchFilter(queryBuilder, 'classRoom.branchId = :branchId');

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(LessonPlan).findOne({
      where: {
        id,
        classRooms: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      relations: {
        subject: true,
        createdBy: true,
        attachments: true,
        classRooms: {
          parent: true,
          faculty: true
        }
      },
      select: lessonPlanSelectCols,
    });

    if (!existing) throw new NotFoundException('Lesson plan not found');

    return existing;
  }

  async update(id: string, updateLessonPlanDto: UpdateLessonPlanDto) {
    const existing = await this.findOne(id);
    const attachments = updateLessonPlanDto.attachmentIds ?
      await this.filesService.findAllByIds(updateLessonPlanDto.attachmentIds)
      : existing.attachments;

    // validate subject
    const subject = updateLessonPlanDto.subjectId
      ? await this.getSubject(updateLessonPlanDto.subjectId)
      : existing.subject;

    // validate class room
    const classRooms = updateLessonPlanDto.classRoomIds?.length
      ? await this.getRepository(ClassRoom).find({
        where: {
          id: In(updateLessonPlanDto.classRoomIds)
        },
        relations: ['parent']
      })
      : existing.classRooms;

    // validate if class room have the subject
    if (!classRooms?.length) throw new BadRequestException('No class room found with the given ids');

    if (classRooms[0].classType === EClassType.SECTION) {
      const parentClassId = classRooms[0].parent?.id;
      if (parentClassId !== subject.classRoom?.id) throw new BadRequestException('Subject doesn\'t belong to the class room');
    } else if (subject.classRoom?.id !== classRooms[0].id) throw new BadRequestException('Subject doesn\'t belong to the class room');

    existing.attachments = attachments;
    existing.subject = subject;
    existing.classRooms = classRooms;

    const updatedTask = this.getRepository(LessonPlan).merge(existing, updateLessonPlanDto);
    await this.getRepository(LessonPlan).save(updatedTask);

    return { message: 'Lesson plan updated successfully' };
  }

  async updateStatus(id: string, dto: UpdateLessonPlanStatusDto) {
    const existing = await this.getRepository(LessonPlan).findOne({
      where: {
        id,
        classRooms: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      select: { id: true, status: true }
    })

    existing.status = dto.status;

    await this.getRepository(LessonPlan).save(existing);
    return { message: 'Status updated' };
  }

  private async getSubject(id: string) {
    const existing = await this.getRepository(Subject).findOne({
      where: { id },
      relations: { classRoom: true },
      select: { id: true, classRoom: { id: true } }
    })
    if (!existing) throw new NotFoundException(`Subject with id ${id} not found`);

    return existing;
  }

  async remove(id: string) {
    await this.getRepository(LessonPlan).delete({ id });

    return { message: 'Lesson plan deleted' };
  }
}
