import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Brackets, DataSource } from 'typeorm';
import { Task } from './entities/task.entity';
import { SubjectsService } from 'src/subjects/subjects.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { ImagesService } from 'src/file-management/images/images.service';
import paginatedData from 'src/utils/paginatedData';
import { AuthUser } from 'src/common/types/global.type';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { selectTaskCols } from './helpers/select-task-cols.config';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { TaskQueryDto } from './dto/task-query.dto';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';

@Injectable()
export class TasksService extends BaseRepository {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private req: FastifyRequest,
    private readonly accountsService: AccountsService,
    private readonly subjectsService: SubjectsService,
    private readonly imagesService: ImagesService,
  ) {
    super(dataSource, req);
  }

  async create(createTaskDto: CreateTaskDto, currentUser: AuthUser) {
    const account = await this.accountsService.findOne(currentUser.accountId);
    const subject = await this.subjectsService.findOne(createTaskDto.subjectId, currentUser);

    const attatchments = createTaskDto.attatchmentIds?.length
      ? await this.imagesService.findAllByIds(createTaskDto.attatchmentIds)
      : null;

    // validate if class room have the subject
    const classRooms = await this.getRepository(ClassRoom).createQueryBuilder('classRoom')
      .leftJoin('classRoom.subjects', 'subject')
      .where('subject.id = :subjectId', { subjectId: createTaskDto.subjectId })
      .getMany();

    if (!classRooms.length) throw new BadRequestException('No class found or the subject is not in the class');

    const newTask = this.getRepository(Task).create({
      ...createTaskDto,
      setBy: account,
      subject,
      attatchments,
      classRooms,
    })

    const savedTask = await this.getRepository(Task).save(newTask);
    return this.taskMutationReturn(savedTask, 'created');
  }

  async findAll(queryDto: TaskQueryDto) {
    const queryBuilder = this.getRepository(Task).createQueryBuilder('task');

    queryBuilder
      .orderBy("task.createdAt", queryDto.order)
      .offset(queryDto.skip)
      .limit(queryDto.take)
      .leftJoin('task.subject', 'subject')
      .leftJoin('task.attatchments', 'attatchments')
      .leftJoin('subject.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(task.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });

        if (queryDto.classRoomId) {
          qb.andWhere(new Brackets(qb => { // if class room id, check in both section and class
            qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
            qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
          }))
        }

        queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // section is the class room
        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
        queryDto.taskType && qb.andWhere('task.taskType = :taskType', { taskType: queryDto.taskType });
      }))
      .select([
        "task.id as id",
        "task.title as title",
        "task.submissionDate as submissionDate",
        "task.taskType as taskType",
        "task.marks as marks",
        "task.createdAt as createdAt",
        "subject.subjectName as subjectName",
        "classRoom.id as classRoomId",
        "classRoom.name as classRoomName",
        "parent.id as parentClassId",
        "parent.name as parentClassName",
      ])

    const itemCount = await queryBuilder.getCount();
    const data = await queryBuilder.getRawMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(data, pageMetaDto);
  }

  async findOne(id: string) {
    const existingTask = await this.getRepository(Task).findOne({
      where: { id },
      relations: {
        // setBy: true,
        subject: true,
        attatchments: true
      }
    });
    if (!existingTask) throw new NotFoundException(`Task with id ${id} not found`);
    return existingTask;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const existingTask = await this.findOne(id);
    const attatchments = updateTaskDto.attatchmentIds?.length ?
      await this.imagesService.findAllByIds(updateTaskDto.attatchmentIds)
      : existingTask.attatchments;

    existingTask.attatchments = attatchments;

    const updatedTask = this.getRepository(Task).merge(existingTask, updateTaskDto);
    return this.taskMutationReturn(await this.getRepository(Task).save(updatedTask), 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const removedTask = await this.getRepository(Task).remove(existing);

    return this.taskMutationReturn(removedTask, 'deleted');
  }

  private taskMutationReturn = (task: Task, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Task created successfully' : 'Task updated successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description
      }
    }
  }

}
