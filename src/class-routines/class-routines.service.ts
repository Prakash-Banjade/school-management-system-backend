import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassRoutineDto } from './dto/create-class-routine.dto';
import { UpdateClassRoutineDto } from './dto/update-class-routine.dto';
import { ClassRoutine } from './entities/class-routine.entity';
import { Brackets, DataSource } from 'typeorm';
import { ClassRoutineQueryDto } from './dto/class-routine.query.dto';
import paginatedData from 'src/utils/paginatedData';
import { AuthUser, EClassType, Role } from 'src/common/types/global.type';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { classRoutinesSelectCols } from './helpers/class-routines-select-cols.config';
import { Subject } from 'src/subjects/entities/subject.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { isAdmin, isStudent } from 'src/utils/utils';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { Teacher } from 'src/teachers/entities/teacher.entity';

@Injectable()
export class ClassRoutinesService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly utilitiesService: UtilitiesService,
  ) { super(dataSource, req); }

  async create(dto: CreateClassRoutineDto) {
    const classRoom = await this.getRepository(ClassRoom).findOne({
      where: {
        id: dto.classRoomId,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      relations: {
        parent: true,
        branch: true,
      },
      select: {
        id: true,
        classType: true,
        parent: { id: true },
        branch: { id: true }
      },
    });
    if (!classRoom) throw new NotFoundException('Class room not found');

    const subject = dto.subjectId
      ? await this.getRepository(Subject).findOne({
        where: { id: dto.subjectId },
        relations: { classRoom: true },
        select: { id: true, classRoom: { id: true } }
      })
      : null;

    const teacher = dto.teacherId && await this.getRepository(Teacher).findOne({
      where: {
        id: dto.teacherId,
        assignedSubjects: { id: subject?.id },
      },
      relations: { account: { branch: true } },
      select: { id: true, account: { id: true, branch: { id: true } } }
    });
    if (dto.teacherId && !teacher) throw new NotFoundException('Teacher not found');
    if (teacher && (teacher.account.branch?.id !== classRoom.branch?.id)) throw new BadRequestException('Teacher does not belong to the class room branch');

    // validate if class room have the subject
    subject && this.validateIfClassRoomHaveSubject(subject, classRoom);

    const newClassRoutine = this.getRepository(ClassRoutine).create({
      ...dto,
      classRoom,
      subject,
      teacher: teacher ?? null,
    });

    await this.getRepository(ClassRoutine).save(newClassRoutine);

    return { message: 'Class routine created' };
  }

  private validateIfClassRoomHaveSubject(subject: Subject | null, classRoom: ClassRoom) {
    const parentClass = classRoom?.classType === EClassType.SECTION ? classRoom.parent : classRoom;
    if (parentClass?.id !== subject.classRoom?.id) throw new BadRequestException('Class room does not have the subject');
  }

  async findAll(queryDto: ClassRoutineQueryDto, currentUser: AuthUser) {
    const querybuilder = this.getRepository(ClassRoutine).createQueryBuilder('classRoutine');

    querybuilder
      .orderBy("classRoutine.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('classRoutine.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('classRoutine.subject', 'subject')
      .leftJoin('classRoutine.teacher', 'teacher')
      .where(new Brackets(qb => {
        queryDto.dayOfTheWeek && qb.andWhere('classRoutine.dayOfTheWeek = :dayOfTheWeek', { dayOfTheWeek: queryDto.dayOfTheWeek });

        if (isAdmin(currentUser) && queryDto.classRoomId) { // routine can be associated with parent ot itself is a parent
          qb.andWhere(new Brackets(qb => {
            qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
            qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
          }))
        }

        if (isAdmin(currentUser)) { // admin access
          queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // the sectionId send by the frontend is the class room id
          queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
        } else if (isStudent(currentUser)) {
          qb.andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId });
        }
      }))

    applySelectColumns(querybuilder, classRoutinesSelectCols, 'classRoutine');
    this.utilitiesService.applyBranchFilter(querybuilder, 'classRoom.branchId = :branchId');

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(ClassRoutine).findOne({
      where: { id },
      relations: ['classRoom', 'subject'],
    })

    if (!existing) throw new Error('ClassRoutine not found');
    return existing
  }

  async update(id: string, updateClassRoutineDto: UpdateClassRoutineDto) {
    const existing = await this.getRepository(ClassRoutine).findOne({
      where: { id, classRoom: { branch: { id: this.utilitiesService.getBranchId() } } },
      relations: ['classRoom', 'teacher', 'subject'],
      select: { classRoom: { id: true }, teacher: { id: true }, subject: { id: true } }
    });
    if (!existing) throw new NotFoundException('Class routine not found');

    // update subject
    if (updateClassRoutineDto.subjectId && (updateClassRoutineDto.subjectId !== existing.subject?.id || !existing.subject)) {
      const subject = await this.getRepository(Subject).findOne({ where: { id: updateClassRoutineDto.subjectId }, select: { id: true } });
      if (!subject) throw new NotFoundException('Subject not found');
      existing.subject = subject;
    }

    // update class room
    if (updateClassRoutineDto.classRoomId && (updateClassRoutineDto.classRoomId !== existing.classRoom?.id || !existing.classRoom)) {
      const classRoom = await this.getRepository(ClassRoom).findOne({ where: { id: updateClassRoutineDto.classRoomId }, select: { id: true } });
      if (!classRoom) throw new NotFoundException('Class room not found');
      existing.classRoom = classRoom;
    }

    if (updateClassRoutineDto.teacherId && (updateClassRoutineDto.teacherId !== existing.teacher?.id || !existing.teacher)) {
      const teacher = await this.getRepository(Teacher).findOne({ where: { id: updateClassRoutineDto.teacherId }, select: { id: true } });
      if (!teacher) throw new NotFoundException('Teacher not found');
      existing.teacher = teacher;
    }

    Object.assign(existing, {
      ...updateClassRoutineDto,
    });

    await this.getRepository(ClassRoutine).save(existing);

    return { message: 'Class routine updated' }
  }

  async remove(id: string) {
    await this.getRepository(ClassRoutine).delete({ id });

    return { message: 'Class routine deleted' };
  }
}
