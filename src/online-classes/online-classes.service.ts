import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { UpdateOnlineClassDto, UpdateOnlineClassStatusDto } from './dto/update-online-class.dto';
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
import { EClassType, Role } from 'src/common/types/global.type';
import { Student } from 'src/students/entities/student.entity';
import { isStudent } from 'src/utils/utils';
import { StreamClientProvider } from 'src/auth-system/stream-client/stream-client-provider';
import { UserRequest } from '@stream-io/node-sdk';

@Injectable()
export class OnlineClassesService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    private readonly utilitiesService: UtilitiesService,
    private readonly streamClientProvider: StreamClientProvider,
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
    });

    const savedOnlineClass = await this.getRepository(OnlineClass).save(newOnlineClass);

    const students = await this.getStudents(classRoom.id);

    await this.insertStudentsToStream(students); // need to insert users to stream inorder to reference them in call

    return {
      message: !dto.scheduleDate ? 'Online class created' : 'Online class is scheduled successfully',
      id: savedOnlineClass.id, // used in frontend to setup callId
      students: students.map(s => s.id),
    };
  };

  async insertStudentsToStream(students: { id: string, fullName: string, profileImageUrl: string }[]) {
    const client = this.streamClientProvider.getClient();

    const users: UserRequest[] = students.map(s => ({
      id: s.id,
      user_id: s.id,
      name: s.fullName,
      profileImage: s.profileImageUrl,
    }))

    await client.upsertUsers(users);
  }

  async getStudents(classRoomId: string): Promise<{ id: string, fullName: string, profileImageUrl: string }[]> {
    const academicYearId = await this.utilitiesService.getAcademicYearId();
    const branchId = this.utilitiesService.getBranchId();

    const queryBuilder = this.getRepository(Student).createQueryBuilder('student')
      .innerJoin('student.enrollments', 'enrollments', "enrollments.academicYearId = :academicYearId", { academicYearId })
      .leftJoin('student.account', 'account')
      .leftJoin('account.profileImage', 'profileImage')
      .where('enrollments.classRoomId = :classRoomId', { classRoomId })
      .andWhere('account.branchId = :branchId', { branchId })
      .select([
        'account.id as id',
        'CONCAT(account.firstName, " ", account.lastName) as fullName',
        'profileImage.url as profileImageUrl',
      ]);

    return await queryBuilder.getRawMany();
  }

  findAll(queryDto: OnlineClassQueryDto) {
    const currentUser = this.utilitiesService.getCurrentUser();
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
        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });

        if (isStudent(currentUser)) {
          qb.andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId });
        } else {
          queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
          queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });
        }

        if (currentUser.role === Role.TEACHER) {
          qb.andWhere('teacher.accountId = :accountId', { accountId: currentUser.accountId });
        } else {
          queryDto.teacherId && qb.andWhere('teacher.id = :teacherId', { teacherId: queryDto.teacherId });
        }
      }))
      .select([
        'onlineClass.id as id',
        'onlineClass.title as title',
        'onlineClass.status as status',
        'onlineClass.scheduleDate as scheduleDate',
        'CONCAT(teacher.firstName, " ", teacher.lastName) as teacherName',
        'subject.subjectName as subjectName',
        'CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, " - ", classRoom.name) END as classRoomName',
      ]);

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const currentUser = this.utilitiesService.getCurrentUser();

    const existing = await this.getRepository(OnlineClass).findOne({
      where: {
        id,
        classRoom: isStudent(currentUser) ? { id: currentUser.classRoomId } : undefined,
        teacher: currentUser.role === Role.TEACHER ? { account: { id: currentUser.accountId } } : undefined
      },
      relations: { teacher: true, classRoom: { parent: true }, subject: true },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        status: true,
        scheduleDate: true,
        teacher: {
          id: true,
          firstName: true,
          lastName: true,
        },
        classRoom: {
          id: true,
          name: true,
          parent: {
            id: true,
            name: true
          }
        },
        subject: {
          id: true,
          subjectName: true,
          subjectCode: true,
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

  async updateStatus(id: string, dto: UpdateOnlineClassStatusDto) {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const existing = await this.getRepository(OnlineClass).findOne({
      where: {
        id,
        teacher: { account: { id: accountId } }
      },
      select: { id: true, status: true }
    });

    if (existing.status === EOnlineClassStatus.Cancelled || existing.status === EOnlineClassStatus.Completed) throw new ForbiddenException('Cannot change the status now');
    if (existing.status === EOnlineClassStatus.Live && dto.status === EOnlineClassStatus.Scheduled) throw new ForbiddenException('Now allowed to change status');
    if (existing.status === EOnlineClassStatus.Live && dto.status === EOnlineClassStatus.Cancelled) throw new BadRequestException("Cannot cancel the live class. Please end the class first.");

    if (!existing) throw new NotFoundException('Online class not found');

    await this.getRepository(OnlineClass).update({ id }, dto);

    return { message: 'Online class status updated' };
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
