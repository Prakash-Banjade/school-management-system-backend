import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto, UpdateLessonPlanStatusDto } from './dto/update-lesson-plan.dto';
import { Brackets, Repository } from 'typeorm';
import { FilesService } from 'src/file-management/files/files.service';
import { LessonPlan } from './entities/lesson-plan.entity';
import { AuthUser } from 'src/common/types/global.type';
import { LessonPlanQueryDto } from './dto/lesson-plan-query.dto';
import { lessonPlanSelectCols } from './helpers/lesson-plan-select-cols';
import paginatedData from 'src/utils/paginatedData';
import { isAdmin, isStudent, isTeacher } from 'src/utils/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';

@Injectable()
export class LessonPlansService {
  constructor(
    @InjectRepository(LessonPlan) private readonly lessonPlansRepo: Repository<LessonPlan>,
    @InjectRepository(ClassRoutine) private readonly classRoutinesRepo: Repository<ClassRoutine>,
    private readonly filesService: FilesService,
  ) { }

  async create(dto: CreateLessonPlanDto, currentUser: AuthUser) {
    if (!isTeacher(currentUser)) throw new BadRequestException('Only teacher can create lesson plan');

    const attachments = dto.attachmentIds?.length
      ? await this.filesService.findAllByIds(dto.attachmentIds)
      : null;

    // validate if the teacher has schedule in the class room with the subject
    const classRoutine = await this.classRoutinesRepo.findOne({
      where: { teacher: { id: currentUser.teacherId }, classRoom: { id: dto.classRoomId }, subject: { id: dto.subjectId } },
      relations: { subject: true, teacher: true, classRoom: true },
      select: { id: true, teacher: { id: true }, classRoom: { id: true }, subject: { id: true } },
    });

    if (!classRoutine) throw new BadRequestException('You do not have schedule in the class room with the subject');

    const newLessonPlan = this.lessonPlansRepo.create({
      ...dto,
      subject: classRoutine.subject,
      classRoom: classRoutine.classRoom,
      attachments,
      createdBy: classRoutine.teacher,
    });

    await this.lessonPlansRepo.save(newLessonPlan);

    return { message: 'Lesson plan created' };
  }

  findAll(queryDto: LessonPlanQueryDto, currentUser: AuthUser, branchId: string | undefined) {
    const queryBuilder = this.lessonPlansRepo.createQueryBuilder('lessonPlan');

    queryBuilder
      .orderBy("lessonPlan.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('lessonPlan.subject', 'subject')
      .leftJoin('lessonPlan.classRoom', 'classRoom')
      .leftJoin('classRoom.faculty', 'faculty')
      .leftJoin('lessonPlan.createdBy', 'createdBy')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(lessonPlan.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });
        queryDto.status?.length && qb.andWhere('lessonPlan.status IN (:...status)', { status: queryDto.status });
      }))

    if (branchId) {
      queryBuilder.andWhere("classRoom.branchId = :branchId", { branchId });
    }

    if (isAdmin(currentUser) || isTeacher(currentUser)) {
      queryBuilder.andWhere(new Brackets(qb => {
        queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });

        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR classRoom.parentId = :classRoomId', { classRoomId: queryDto.sectionId ?? queryDto.classRoomId }); // check in both section and class
        queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // section is the class room
      }))
    }

    if (isStudent(currentUser)) {
      queryBuilder.andWhere("classRoom.id = :classRoomId", { classRoomId: currentUser.classRoomId })
    }

    if (queryDto.subjectId) {
      queryBuilder.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
    }

    queryBuilder.select([
      "lessonPlan.id",
      "lessonPlan.title",
      "lessonPlan.status",
      "lessonPlan.startDate",
      "lessonPlan.endDate",
      "lessonPlan.createdAt",
      "subject.subjectName",
      "classRoom.fullName",
      "faculty.name",
      "createdBy.firstName",
      "createdBy.lastName",
    ])

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string, currentUser: AuthUser) {
    const existing = await this.lessonPlansRepo.findOne({
      where: {
        id,
        classRoom: {
          branch: { id: currentUser.branchId },
          ...(isStudent(currentUser) ? { id: currentUser.classRoomId } : {}) // student can see only his class
        }
      },
      relations: {
        subject: true,
        createdBy: true,
        attachments: true,
        classRoom: {
          faculty: true,
          parent: true,
        }
      },
      select: lessonPlanSelectCols,
    });

    if (!existing) throw new NotFoundException('Lesson plan not found');

    return existing;
  }

  async update(id: string, updateLessonPlanDto: UpdateLessonPlanDto, currentUser: AuthUser) {
    if (!isTeacher(currentUser)) throw new BadRequestException('Access denied');

    const existing = await this.lessonPlansRepo.findOne({
      where: {
        id,
        createdBy: { id: currentUser.teacherId },
      },
      select: { id: true }
    });

    if (!existing) throw new NotFoundException('Lesson plan not found');

    const attachments = updateLessonPlanDto.attachmentIds ?
      await this.filesService.findAllByIds(updateLessonPlanDto.attachmentIds)
      : existing.attachments;

    existing.attachments = attachments;

    const updatedTask = this.lessonPlansRepo.merge(existing, updateLessonPlanDto);
    await this.lessonPlansRepo.save(updatedTask);

    return { message: 'Lesson plan updated successfully' };
  }

  async updateStatus(id: string, dto: UpdateLessonPlanStatusDto, currentUser: AuthUser) {
    if (!isTeacher(currentUser)) throw new BadRequestException('Access denied');

    const existing = await this.lessonPlansRepo.findOne({
      where: {
        id,
        createdBy: { id: currentUser.teacherId }
      },
      select: { id: true, status: true }
    })

    existing.status = dto.status;

    await this.lessonPlansRepo.save(existing);
    return { message: 'Status updated' };
  }

  async remove(id: string, currentUser: AuthUser) {
    if (isTeacher(currentUser)) {
      await this.lessonPlansRepo.delete({ id, createdBy: { id: currentUser.teacherId } });

    } else {
      await this.lessonPlansRepo.delete({ id });
    }

    return { message: 'Lesson plan deleted' };
  }
}
