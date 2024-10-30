import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { Brackets, Repository } from 'typeorm';
import { SubjectOptionsQueryDto, SubjectQueryDto } from './dto/subject-query.dto';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { TeachersService } from 'src/teachers/teachers.service';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { singleSubjectSelelctCols, subjectSelectCols } from './helpers/subject-select-cols.config';
import { AuthUser, Role } from 'src/common/types/global.type';
import { isStudent } from 'src/utils/isStudent';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject) private readonly subjectsRepo: Repository<Subject>,
    private readonly classRoomsService: ClassRoomsService,
    private readonly teachersService: TeachersService,
  ) { }

  async create(createSubjectDto: CreateSubjectDto) {
    const teacher = createSubjectDto.teacherId
      ? await this.teachersService.findOne(createSubjectDto.teacherId)
      : null;

    const classRoom = createSubjectDto.classRoomId
      ? await this.classRoomsService.findOne(createSubjectDto.classRoomId)
      : null;

    const newSubject = this.subjectsRepo.create({
      ...createSubjectDto,
      teacher,
      classRoom
    });
    const createdSubject = await this.subjectsRepo.save(newSubject);

    return this.subjectMutationReturn(createdSubject, 'created');

  }

  async findAll(queryDto: SubjectQueryDto, currentUser: AuthUser) {
    const queryBuilder = this.subjectsRepo.createQueryBuilder('subject');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy("subject.createdAt", queryDto.order)
      .withDeleted()
      .leftJoin('subject.classRoom', 'classRoom')
      .leftJoin('subject.teacher', 'teacher')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(subject.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })

        if (currentUser.role === Role.ADMIN) { // admin access
          queryDto.classRoomId && qb.andWhere("classRoom.id = :classRoomId", { classRoomId: queryDto.classRoomId })
        } else if (isStudent(currentUser)) { // student access
          qb.andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId })
        }
      }))

    applySelectColumns(queryBuilder, subjectSelectCols, 'subject');

    return paginatedData(queryDto, queryBuilder);
  }

  async getOptions(queryDto: SubjectOptionsQueryDto) {
    return this.subjectsRepo.createQueryBuilder('subject')
      .orderBy("subject.createdAt", 'DESC')
      .where('subject.classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId })
      .select(["subject.id", "subject.subjectName"])
      .getMany();
  }

  async findOne(id: string, currentUser?: AuthUser) {
    const existing = await this.subjectsRepo.findOne({
      where: {
        id,
        classRoom: {
          id: currentUser && isStudent(currentUser) ? currentUser.classRoomId : undefined, // different access for student and admin
        }
      },
      relations: {
        classRoom: true,
        teacher: true,
      },
      select: singleSubjectSelelctCols,
    })
    if (!existing) throw new NotFoundException(`Subject with id ${id} not found`);

    return existing;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);

    const classRoom = updateSubjectDto.classRoomId
      ? await this.classRoomsService.findOne(updateSubjectDto.classRoomId)
      : null;

    const teacher = updateSubjectDto.teacherId
      ? await this.teachersService.findOne(updateSubjectDto.teacherId)
      : null;

    Object.assign(existing, updateSubjectDto);
    existing.classRoom = classRoom;
    existing.teacher = teacher;

    const updatedSubject = await this.subjectsRepo.save(existing);
    return this.subjectMutationReturn(updatedSubject, 'updated');
  }

  async remove(id: string, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);
    const deletedSubject = await this.subjectsRepo.softRemove(existing);

    return this.subjectMutationReturn(deletedSubject, 'deleted')
  }

  private subjectMutationReturn = (subject: Subject, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Subject created successfully' : 'Subject updated successfully',
      subject: {
        id: subject.id,
        name: subject.subjectName,
        subjectCode: subject.subjectCode,
      }
    }
  }
}
