import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Brackets, DataSource, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { SubjectsService } from 'src/subjects/subjects.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { AuthUser, EClassType } from 'src/common/types/global.type';
import { selectTaskCols } from './helpers/select-task-cols.config';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { TaskQueryDto } from './dto/task-query.dto';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';
import { FilesService } from 'src/file-management/files/files.service';

@Injectable()
export class TasksService extends BaseRepository {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private req: FastifyRequest,
    private readonly accountsService: AccountsService,
    private readonly subjectsService: SubjectsService,
    private readonly filesService: FilesService,
  ) {
    super(dataSource, req);
  }

  async create(createTaskDto: CreateTaskDto, currentUser: AuthUser) {
    const account = await this.accountsService.findOne(currentUser.accountId);

    const attachments = createTaskDto.attachmentIds?.length
      ? await this.filesService.findAllByIds(createTaskDto.attachmentIds)
      : null;

    // validate if class room have the subject
    const classRoomWithSubject = await this.getRepository(ClassRoom).createQueryBuilder('classRoom')
      .leftJoin('classRoom.subjects', 'subject')
      .leftJoin('classRoom.children', 'children')
      .where('subject.id = :subjectId', { subjectId: createTaskDto.subjectId })
      .select(['classRoom.id', 'subject.id', 'children.id'])
      .getOne();

    if (!classRoomWithSubject) throw new NotFoundException('No class found or the subject is not in the class')

    const classRoomsTheTaskFor = createTaskDto.classRoomIds?.length > 1 // if length is greater than one, then class room must be of type section, so we need to get children
      ? classRoomWithSubject.children?.filter(classRoom => createTaskDto.classRoomIds.includes(classRoom.id)) // getting only those childrens which has a match in classRoomIds
      : classRoomWithSubject.id === createTaskDto.classRoomIds[0] // check if the classRoomIds[0](can be primary class) is equal to the classRoomWithSubject
        ? [classRoomWithSubject]
        : [classRoomWithSubject.children?.find(classRoom => classRoom.id === createTaskDto.classRoomIds[0])].filter(Boolean); // At this stage, it is guaranteed that the classRoomIds[0] is a child of the classRoomWithSubject;

    if (!classRoomsTheTaskFor?.length) throw new NotFoundException('Class room not found with subject');

    const newTask = this.getRepository(Task).create({
      ...createTaskDto,
      setBy: account,
      subject: classRoomWithSubject.subjects[0],
      attachments,
      classRooms: classRoomsTheTaskFor,
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
      .leftJoin('task.classRooms', 'classRoom')
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
        "task.deadline as deadline",
        "task.taskType as taskType",
        "task.marks as marks",
        "task.createdAt as createdAt",
        "subject.subjectName as subjectName",
        "JSON_ARRAYAGG(JSON_OBJECT('id', classRoom.id, 'name', classRoom.name)) as classRooms", // Aggregate classrooms as JSON
        "MAX(parent.id) as parentClassId",  // Aggregate non-grouped fields with MAX
        "MAX(parent.name) as parentClassName",
      ])
      .groupBy("task.id");

    const itemCount = await queryBuilder.getCount();
    const data = (await queryBuilder.getRawMany()).map(task => {
      return {
        ...task,
        classRooms: typeof task.classRooms === 'string' ? JSON.parse(task.classRooms) : task.classRooms, // convert stringified JSON to array of objects
      }
    })

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(data, pageMetaDto);
  }

  async getStatistics(taskId: string) {
    const queryBuilder = this.getRepository(Task).createQueryBuilder('task')
      .where('task.id = :id', { id: taskId })
      .leftJoin('task.submissions', 'submission')
      .leftJoin('submission.evaluation', 'evaluation')
      .select([
        'COUNT(DISTINCT submission.id) as totalSubmissions',
        'COUNT(DISTINCT evaluation.id) as totalEvaluations',
        'COUNT(CASE WHEN DATE(submission.createdAt) <= DATE(task.deadline) THEN 1 END) as beforeDeadline',
        'COUNT(CASE WHEN DATE(submission.createdAt) > DATE(task.deadline) THEN 1 END) as afterDeadline',
      ])

    const taskStatistics = await queryBuilder.getRawOne();
    return taskStatistics;
  }

  async findOne(id: string) {
    const existingTask = await this.getRepository(Task).findOne({
      where: { id },
      relations: {
        subject: true,
        setBy: true,
        attachments: true,
        classRooms: {
          parent: true
        }
      },
      select: selectTaskCols,
    });
    if (!existingTask) throw new NotFoundException(`Task with id ${id} not found`);
    return existingTask;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const existingTask = await this.findOne(id);
    const attachments = updateTaskDto.attachmentIds ?
      await this.filesService.findAllByIds(updateTaskDto.attachmentIds)
      : existingTask.attachments;

    // validate subject
    const subject = updateTaskDto.subjectId
      ? await this.subjectsService.findOne(updateTaskDto.subjectId)
      : existingTask.subject;

    // validate class room
    const classRooms = updateTaskDto.classRoomIds?.length
      ? await this.getRepository(ClassRoom).find({
        where: {
          id: In(updateTaskDto.classRoomIds)
        },
        relations: ['parent']
      })
      : existingTask.classRooms;

    // validate if class room have the subject
    if (!classRooms?.length) throw new BadRequestException('No class room found with the given ids');

    if (classRooms[0].classType === EClassType.SECTION) {
      const parentClassId = classRooms[0].parent?.id;
      if (parentClassId !== subject.classRoom?.id) throw new BadRequestException('Subject doesn\'t belong to the class room');
    } else if (subject.classRoom?.id !== classRooms[0].id) throw new BadRequestException('Subject doesn\'t belong to the class room');

    existingTask.attachments = attachments;
    existingTask.subject = subject;
    existingTask.classRooms = classRooms;

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
      }
    }
  }

}
