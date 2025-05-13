import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject } from './entities/subject.entity';
import { Brackets, DataSource, ILike, In } from 'typeorm';
import { SubjectOptionsQueryDto, SubjectQueryDto } from './dto/subject-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { singleSubjectSelelctCols, subjectSelectCols, subjectSelectCols_basic } from './helpers/subject-select-cols.config';
import { AuthUser, EClassType, ESubjectType } from 'src/common/types/global.type';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { OptionalSubject } from 'src/optional-subject/entities/optional-subject.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { isAdmin, isStudent, isTeacher } from 'src/utils/utils';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { QueryDto } from 'src/common/dto/query.dto';

@Injectable({ scope: Scope.REQUEST })
export class SubjectsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly utilitiesService: UtilitiesService
  ) { super(dataSource, req); }

  async create(createSubjectDto: CreateSubjectDto) {
    const founcSubjectWithSameCode = await this.getRepository(Subject).findOne({
      where: {
        subjectCode: ILike(`${createSubjectDto.subjectCode}`),
        classRoom: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      select: { id: true }
    });
    if (founcSubjectWithSameCode) throw new ConflictException('Subject with same code already exists');

    // get teacher
    const teachers = createSubjectDto.teacherIds?.length
      ? await this.getRepository(Teacher).find({ where: { id: In(createSubjectDto.teacherIds), account: { branch: { id: this.utilitiesService.getBranchId() } } }, select: { id: true } })
      : [];

    // get class room and validte if class room is primary
    const classRoom = await this.getRepository(ClassRoom).findOne({
      where: { id: createSubjectDto.classRoomId, classType: EClassType.PRIMARY },
      select: { id: true, classType: true }
    });
    if (!classRoom) throw new NotFoundException('Class room not found');

    // create optional subject instance if subject is optional
    const optionalSubject = createSubjectDto.type === ESubjectType.OPTIONAL ? this.getRepository(OptionalSubject).create({
      classRoom,
      students: [],
    }) : null;

    const newSubject = this.getRepository(Subject).create({
      ...createSubjectDto,
      teachers,
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
      .leftJoin('classRoom.faculty', 'faculty')
      .leftJoin('subject.teachers', 'teachers')
      .leftJoin('teachers.account', 'account')
      .andWhere(new Brackets(qb => {
        if (queryDto.search) {
          qb.orWhere("TRIM(LOWER(subject.subjectCode)) = TRIM(LOWER(:search))", { search: queryDto.search })
            .orWhere("LOWER(subject.subjectName) LIKE LOWER(:nameSearch)", { nameSearch: `%${queryDto.search}%` })
        }

        queryDto.types && qb.andWhere("subject.type IN (:...types)", { types: queryDto.types });

        if (isAdmin(currentUser)) { // admin access
          queryDto.classRoomId && qb.andWhere("classRoom.id = :classRoomId", { classRoomId: queryDto.classRoomId })
          queryDto.facultyId && qb.andWhere('classRoom.facultyId = :facultyId', { facultyId: queryDto.facultyId })
        } else if (isStudent(currentUser)) { // student access
          qb.andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId })
        }
      }))
    this.utilitiesService.applyBranchFilter(queryBuilder, "classRoom.branchId = :branchId");

    applySelectColumns(
      queryBuilder,
      queryDto.onlyBasicInfo ? subjectSelectCols_basic : subjectSelectCols,
      'subject'
    );

    return paginatedData(queryDto, queryBuilder);
  }

  // student will query this endpoint
  async findAllByStudent(queryDto: SubjectQueryDto, currentUser: AuthUser) {
    if (!isStudent(currentUser)) return;

    const queryBuilder = this.getRepository(Subject).createQueryBuilder('subject')
      .orderBy("subject.subjectName", queryDto.order)
      .leftJoin('subject.classRoutines', 'classRoutines', 'classRoutines.classRoomId = :studentClassRoomId', { studentClassRoomId: currentUser.classRoomId }) // fetch only the class routines of the student's class room
      .leftJoin('classRoutines.teacher', 'teacher')
      .where('subject.classRoomId = :classRoomId', { classRoomId: currentUser.parentClassId ?? currentUser.classRoomId }) // subject is always in primary class room

    if (queryDto.asOptions) {
      queryBuilder
        .select([
          'subject.id as value',
          'subject.subjectName as label'
        ])
        .groupBy('subject.id');

      return queryBuilder.getRawMany();
    } else {
      queryBuilder.select([
        'subject.id',
        'subject.subjectName',
        'subject.subjectCode',
        'subject.type',
        'teacher.id',
        'teacher.firstName',
        'teacher.lastName',
        'classRoutines.id',
        'classRoutines.startTime',
        'classRoutines.endTime',
        'classRoutines.dayOfTheWeek',
      ]);
      return paginatedData(queryDto, queryBuilder);
    }

  }

  async getOptions(queryDto: SubjectOptionsQueryDto) {
    const currentUser = this.utilitiesService.getCurrentUser();
    const branchId = this.utilitiesService.getBranchId();

    if ((isAdmin(currentUser) || isTeacher(currentUser)) && !queryDto.classRoomId) throw new BadRequestException('classRoomId is required');

    const classRoomId = isStudent(currentUser)
      ? (currentUser.parentClassId ?? currentUser.classRoomId) // subjects are always in primary class
      : queryDto.classRoomId

    const querybuilder = this.getRepository(Subject).createQueryBuilder('subject')
      .orderBy("subject.createdAt", queryDto.order)
      .where('subject.classRoomId = :classRoomId', { classRoomId });

    if (branchId) {
      querybuilder.innerJoin('subject.classRoom', 'classRoom', 'classRoom.branchId = :branchId', { branchId });
    } else {
      querybuilder.leftJoin('subject.classRoom', 'classRoom');
    }

    if (isTeacher(currentUser)) {
      querybuilder.innerJoin(
        "subject.classRoutines",
        "classRoutines",
        "classRoutines.teacherId = :teacherId AND classRoom.id = :classRoomId",
        { teacherId: currentUser.teacherId, classRoomId: queryDto.classRoomId }
      )
    }

    querybuilder.select(["subject.id", "subject.subjectName"]);

    return querybuilder.getMany();
  }

  async findOne(id: string) {
    const existing = await this.getRepository(Subject).findOne({
      where: {
        id,
        classRoom: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      relations: {
        classRoom: true,
        teachers: true,
        optionalSubject: true,
      },
      select: singleSubjectSelelctCols,
    })
    if (!existing) throw new NotFoundException(`Subject with id ${id} not found`);

    return existing;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    const existing = await this.findOne(id);

    // check if subject code is already taken
    if (updateSubjectDto.subjectCode && updateSubjectDto.subjectCode?.toLowerCase() !== existing.subjectCode?.toLowerCase()) {
      const founcSubjectWithSameCode = await this.getRepository(Subject).findOne({
        where: { subjectCode: ILike(`${updateSubjectDto.subjectCode}`), classRoom: { branch: { id: this.utilitiesService.getBranchId() } } },
        select: { id: true }
      });
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

    const teachers = updateSubjectDto.teacherIds?.length
      ? await this.getRepository(Teacher).find({ where: { id: In(updateSubjectDto.teacherIds) }, select: { id: true } })
      : []

    Object.assign(existing, updateSubjectDto);
    existing.teachers = teachers;

    await this.getRepository(Subject).save(existing);
    return { message: 'Subject updated' };
  }

  async remove(id: string) {
    await this.getRepository(Subject).delete({ id });

    return { message: 'Subject deleted' };
  }
}
