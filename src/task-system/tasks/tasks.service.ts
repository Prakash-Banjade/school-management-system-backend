import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Brackets, In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { AuthUser } from 'src/common/types/global.type';
import { selectTaskCols } from './helpers/select-task-cols.config';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { TaskQueryDto } from './dto/task-query.dto';
import { FilesService } from 'src/file-management/files/files.service';
import { paginatedRawData } from 'src/utils/paginatedData';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { isAdmin, isTeacher } from 'src/utils/utils';
import { Subject } from 'src/subjects/entities/subject.entity';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(ClassRoom) private readonly classRoomRepo: Repository<ClassRoom>,
    @InjectRepository(ClassRoutine) private readonly classRoutineRepo: Repository<ClassRoutine>,
    private readonly filesService: FilesService,
  ) { }

  async create(createTaskDto: CreateTaskDto, currentUser: AuthUser) {
    const account = await this.accountRepo.findOne({ where: { id: currentUser.accountId }, select: { id: true } });

    const attachments = createTaskDto.attachmentIds?.length
      ? await this.filesService.findAllByIds(createTaskDto.attachmentIds)
      : [];

    let classRoom: ClassRoom;
    let subject: Subject;

    if (isAdmin(currentUser)) {
      // validate if class room have the subject
      const classRoomWithSubject = await this.classRoomRepo.createQueryBuilder('classRoom')
        .leftJoinAndSelect('classRoom.subjects', 'subject')
        .leftJoinAndSelect('classRoom.children', 'children')
        .where('subject.id = :subjectId', { subjectId: createTaskDto.subjectId })
        .select(['classRoom.id', 'subject.id', 'children.id'])
        .getOne();

      if (!classRoomWithSubject || !classRoomWithSubject.subjects[0]) throw new NotFoundException('No class found or the subject is not in the class')

      subject = classRoomWithSubject.subjects[0];

      // check if class room has children, then classroom must be one of the children else the same class room
      if (classRoomWithSubject.children.length > 0) {
        classRoom = classRoomWithSubject.children.find((c) => c.id === createTaskDto.classRoomId);
      } else if (classRoomWithSubject.id === createTaskDto.classRoomId) {
        classRoom = classRoomWithSubject;
      }

      // if class room is not found, throw error
      if (!classRoom) throw new NotFoundException('No class found')
    }

    if (isTeacher(currentUser)) {
      // teacher must posses a schedule in the class room with the subject
      const classRoutine = await this.classRoutineRepo.createQueryBuilder('classRoutine')
        .leftJoinAndSelect('classRoutine.classRoom', 'classRoom')
        .leftJoinAndSelect('classRoutine.subject', 'subject')
        .leftJoinAndSelect('classRoutine.teacher', 'teacher')
        .where("teacher.id = :teacherId", { teacherId: currentUser.teacherId })
        .andWhere("subject.id = :subjectId", { subjectId: createTaskDto.subjectId })
        .andWhere("classRoom.id = :classRoomId", { classRoomId: createTaskDto.classRoomId })
        .select(['classRoutine.id', 'classRoom.id', 'subject.id'])
        .getOne();

      if (!classRoutine) throw new BadRequestException("You don't have a schedule in the class.")

      classRoom = classRoutine.classRoom;
      subject = classRoutine.subject;
    }

    const newTask = this.taskRepo.create({
      ...createTaskDto,
      setBy: account,
      subject,
      attachments,
      classRoom,
    });

    await this.taskRepo.save(newTask);

    return { message: 'Task created successfully' };
  }

  async findAll(queryDto: TaskQueryDto, currentUser: AuthUser, branchId: string | undefined) {
    const queryBuilder = this.taskRepo.createQueryBuilder('task');

    queryBuilder
      .orderBy("task.createdAt", queryDto.order)
      .offset(queryDto.skip)
      .limit(queryDto.take)
      .leftJoin('task.subject', 'subject')
      .leftJoin('task.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('classRoom.faculty', 'faculty')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(task.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });

        queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });
        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR parent.id = :classRoomId', { classRoomId: queryDto.classRoomId }); // check in both section and class
        queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // section is the class room

        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
        queryDto.taskType && qb.andWhere('task.taskType = :taskType', { taskType: queryDto.taskType });
      }));

    if (branchId) {
      queryBuilder.andWhere('classRoom.branchId = :branchId', { branchId });
    }

    queryBuilder
      .select([
        "task.id as id",
        "task.title as title",
        "task.deadline as deadline",
        "task.taskType as taskType",
        "task.marks as marks",
        "task.createdAt as createdAt",
        "subject.subjectName as subjectName",
        "classRoom.id as classRoomId",
        "classRoom.fullName as classRoomName",
        "parent.id as parentClassId",  // Aggregate non-grouped fields with MAX
        "parent.name as parentClassName",
        "faculty.name as faculty",
      ])
      .groupBy("task.id");

    if (isTeacher(currentUser)) {
      queryBuilder
        .innerJoin('classRoom.classRoutines', 'classRoutine', 'classRoutine.teacherId = :teacherId', { teacherId: currentUser.teacherId })
    }

    return paginatedRawData(queryDto, queryBuilder);
  }

  async getStatistics(taskId: string) {
    const queryBuilder = this.taskRepo.createQueryBuilder('task')
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

  async findOne(id: string, branchId: string) {
    const existingTask = await this.taskRepo.findOne({
      where: {
        id,
        classRoom: { branch: { id: branchId } },
      },
      relations: {
        subject: true,
        setBy: true,
        attachments: true,
        classRoom: {
          parent: true,
          faculty: true
        }
      },
      select: selectTaskCols,
    });

    if (!existingTask) throw new NotFoundException(`Task with id ${id} not found`);

    return existingTask;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, branchId: string, currentUser: AuthUser) {
    const existingTask = await this.findOne(id, branchId);

    if (isTeacher(currentUser)) { // if user is teacher, validate if he is allowed to update
      const classRoutine = await this.classRoutineRepo.findOne({
        where: {
          classRoom: { id: existingTask.classRoom.id },
          subject: { id: existingTask.subject.id },
          teacher: { id: currentUser.teacherId }
        },
        select: { id: true }
      });

      if (!classRoutine) throw new ForbiddenException('Access denied');
    }

    const attachments = updateTaskDto.attachmentIds ?
      await this.filesService.findAllByIds(updateTaskDto.attachmentIds)
      : existingTask.attachments;

    // // validate subject
    // const subject = updateTaskDto.subjectId
    //   ? await this.subjectsService.findOne(updateTaskDto.subjectId)
    //   : existingTask.subject;

    // // validate class room
    // const classRooms = updateTaskDto.classRoomIds?.length
    //   ? await this.classRoomRepo.find({
    //     where: {
    //       id: In(updateTaskDto.classRoomIds)
    //     },
    //     relations: ['parent']
    //   })
    //   : existingTask.classRooms;

    // validate if class room have the subject
    // if (!classRooms?.length) throw new BadRequestException('No class room found with the given ids');

    // if (classRooms[0].classType === EClassType.SECTION) {
    //   const parentClassId = classRooms[0].parent?.id;
    //   if (parentClassId !== subject.classRoom?.id) throw new BadRequestException('Subject doesn\'t belong to the class room');
    // } else if (subject.classRoom?.id !== classRooms[0].id) throw new BadRequestException('Subject doesn\'t belong to the class room');

    existingTask.attachments = attachments;

    const updatedTask = this.taskRepo.merge(existingTask, updateTaskDto);

    await this.taskRepo.save(updatedTask)

    return { message: 'Task updated' }
  }

  async remove(id: string, currentUser: AuthUser) {
    if (isTeacher(currentUser)) {
      const existingTask = await this.findOne(id, currentUser.branchId);

      if (isTeacher(currentUser)) { // if user is teacher, validate if he is allowed to delete
        const classRoutine = await this.classRoutineRepo.findOne({
          where: {
            classRoom: { id: existingTask.classRoom.id },
            subject: { id: existingTask.subject.id },
            teacher: { id: currentUser.teacherId }
          },
          select: { id: true }
        });

        if (!classRoutine) throw new ForbiddenException('Access denied');

        await this.taskRepo.delete({ id });
      }
    }

    await this.taskRepo.delete({ id });

    return { message: 'Task removed' }
  }
}
