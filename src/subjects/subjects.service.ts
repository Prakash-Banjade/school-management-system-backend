import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject } from './entities/subject.entity';
import { Brackets, DataSource } from 'typeorm';
import { SubjectOptionsQueryDto, SubjectQueryDto } from './dto/subject-query.dto';
import { TeachersService } from 'src/teachers/teachers.service';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { singleSubjectSelelctCols, subjectSelectCols, subjectSelectCols_basic } from './helpers/subject-select-cols.config';
import { AuthUser, EClassType, ESubjectType, Role } from 'src/common/types/global.type';
import { isStudent } from 'src/utils/isStudent';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { OptionalSubject } from 'src/optional-subject/entities/optional-subject.entity';

@Injectable({ scope: Scope.REQUEST })
export class SubjectsService extends BaseRepository {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private req: FastifyRequest,
    private readonly teachersService: TeachersService,
  ) { super(dataSource, req); }

  async create(createSubjectDto: CreateSubjectDto) {
    const founcSubjectWithSameCode = await this.getRepository(Subject).findOneBy({ subjectCode: createSubjectDto.subjectCode });
    if (founcSubjectWithSameCode) throw new ConflictException('Subject with same code already exists');

    // get teacher
    const teacher = createSubjectDto.teacherId ? await this.teachersService.findOne(createSubjectDto.teacherId) : null;

    // get class room and validte if class room is primary
    const classRoom = await this.getRepository(ClassRoom).findOne({ where: { id: createSubjectDto.classRoomId }, select: { id: true, classType: true } });
    if (!classRoom) throw new NotFoundException('Class room not found');
    if (classRoom.classType !== EClassType.PRIMARY) throw new BadRequestException('Cannot assign subject to section class.');

    // create optional subject instance if subject is optional
    const optionalSubject = createSubjectDto.type === ESubjectType.OPTIONAL ? this.getRepository(OptionalSubject).create({
      classRoom,
      students: [],
    }) : null;

    const newSubject = this.getRepository(Subject).create({
      ...createSubjectDto,
      teacher,
      classRoom,
      optionalSubject, // entity will be created automatically due to cascading
    });
    await this.getRepository(Subject).save(newSubject);

    return { message: 'Subject added' };
  }

  async findAll(queryDto: SubjectQueryDto, currentUser: AuthUser) {
    const queryBuilder = this.getRepository(Subject).createQueryBuilder('subject');

    queryBuilder
      .skip(queryDto.skipPagination ? undefined : queryDto.skip)
      .take(queryDto.skipPagination ? undefined : queryDto.take)
      .orderBy(queryDto.sortBy, queryDto.order)
      .leftJoin('subject.classRoom', 'classRoom')
      .leftJoin('subject.teacher', 'teacher')
      .andWhere(new Brackets(qb => {
        if (queryDto.search) {
          qb.orWhere("TRIM(LOWER(subject.subjectCode)) = TRIM(LOWER(:search))", { search: queryDto.search })
            .orWhere("LOWER(subject.subjectName) LIKE LOWER(:nameSearch)", { nameSearch: `%${queryDto.search}%` })
        }

        queryDto.types && qb.andWhere("subject.type IN (:...types)", { types: queryDto.types });

        if (currentUser.role === Role.ADMIN) { // admin access
          queryDto.classRoomId && qb.andWhere("classRoom.id = :classRoomId", { classRoomId: queryDto.classRoomId })
        } else if (isStudent(currentUser)) { // student access
          qb.andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId })
        }
      }))

    applySelectColumns(
      queryBuilder,
      queryDto.onlyBasicInfo ? subjectSelectCols_basic : subjectSelectCols,
      'subject'
    );

    return paginatedData(queryDto, queryBuilder);
  }

  async getOptions(queryDto: SubjectOptionsQueryDto) {
    return this.getRepository(Subject).createQueryBuilder('subject')
      .orderBy("subject.createdAt", queryDto.order)
      .where('subject.classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId })
      .select(["subject.id", "subject.subjectName"])
      .getMany();
  }

  async findOne(id: string, currentUser?: AuthUser) {
    const existing = await this.getRepository(Subject).findOne({
      where: {
        id,
        classRoom: {
          id: currentUser && isStudent(currentUser) ? currentUser.classRoomId : undefined, // different access for student and admin
        }
      },
      relations: {
        classRoom: true,
        teacher: true,
        optionalSubject: true,
      },
      select: singleSubjectSelelctCols,
    })
    if (!existing) throw new NotFoundException(`Subject with id ${id} not found`);

    return existing;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);

    // check if subject code is already taken
    if (updateSubjectDto.subjectCode && updateSubjectDto.subjectCode !== existing.subjectCode) {
      const founcSubjectWithSameCode = await this.getRepository(Subject).findOneBy({ subjectCode: updateSubjectDto.subjectCode });
      if (founcSubjectWithSameCode) throw new ConflictException('Subject with same code already exists');
    }

    if (updateSubjectDto.type && updateSubjectDto.type !== existing.type) {
      if (updateSubjectDto.type === ESubjectType.OPTIONAL) { // changing subject to optional
        const optionalSubject = this.getRepository(OptionalSubject).create({
          classRoom: existing.classRoom,
          students: [],
        });
        existing.optionalSubject = optionalSubject;
      } else { // changing subject to regular
        existing.optionalSubject && await this.getRepository(OptionalSubject).remove(existing.optionalSubject); // remove optional subject
        existing.optionalSubject = null;
      }
    }

    const teacher = updateSubjectDto.teacherId
      ? await this.teachersService.findOne(updateSubjectDto.teacherId)
      : updateSubjectDto.teacherId === null
        ? null
        : existing.teacher;

    Object.assign(existing, updateSubjectDto);
    existing.teacher = teacher;

    await this.getRepository(Subject).save(existing);
    return { message: 'Subject updated' };
  }

  async remove(id: string, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);
    await this.getRepository(Subject).softRemove(existing);

    return { message: 'Subject deleted' };
  }
}
