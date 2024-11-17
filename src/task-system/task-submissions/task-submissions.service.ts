import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskSubmissionDto } from './dto/create-task-submission.dto';
import { UpdateTaskSubmissionDto } from './dto/update-task-submission.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { DataSource } from 'typeorm';
import { TaskSubmissionQueryDto } from './dto/task-submission-query.dto';
import { TaskSubmission } from './entities/task-submission.entity';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { taskSubmissionSelectCols } from './helpers/task-submission-select-cols.config';
import paginatedData from 'src/utils/paginatedData';
import { AuthUser, EFileMimeType, ETask, ETaskSubmissionStatus } from 'src/common/types/global.type';
import { StudentsService } from 'src/students/students.service';
import { FilesService } from 'src/file-management/files/files.service';
import { Task } from '../tasks/entities/task.entity';
import { isStudent } from 'src/utils/isStudent';

@Injectable()
export class TaskSubmissionsService extends BaseRepository {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private req: FastifyRequest,
    private readonly studentsService: StudentsService,
    private readonly filesService: FilesService
  ) { super(dataSource, req) }

  async create(createTaskSubmissionDto: CreateTaskSubmissionDto, currentUser: AuthUser) {
    if (!isStudent(currentUser)) throw new NotFoundException('Access Denied');

    const student = await this.studentsService.findOneByAccountId(currentUser.accountId); // getting the student

    const task = await this.getRepository(Task).createQueryBuilder('task')
      .leftJoin('task.classRooms', 'classRoom')
      .leftJoin('task.submissions', 'submission', 'submission.studentId = :studentId', { studentId: student.id }) // Join task submissions by student ID
      .where('task.id = :taskId', { taskId: createTaskSubmissionDto.taskId }) // Get the task by ID
      .andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId }) // Ensure task is assigned to the student's classroom
      .andWhere('submission.id IS NULL') // Ensure no existing submission by this student
      .andWhere('task.taskType = :taskType', { taskType: ETask.ASSIGNMENT })
      .select(['task.id', 'task.deadline'])
      .getOne();

    if (!task) throw new NotFoundException('No such task found');

    const attachments = createTaskSubmissionDto.attachmentIds?.length
      ? await this.filesService.findAllByIds(createTaskSubmissionDto.attachmentIds)
      : [];

    if (createTaskSubmissionDto.attachmentIds?.length && !attachments.length) throw new NotFoundException('Attachments not found');

    const status = new Date(task.deadline) < new Date() ? ETaskSubmissionStatus.Late : ETaskSubmissionStatus.Submitted;

    const newSubmission = this.getRepository(TaskSubmission).create({
      ...createTaskSubmissionDto,
      student,
      attachments,
      task,
      status
    });

    await this.getRepository(TaskSubmission).save(newSubmission);

    return { message: 'Task submitted' };
  }

  findAll(queryDto: TaskSubmissionQueryDto) {
    const queryBuilder = this.getRepository(TaskSubmission).createQueryBuilder('taskSubmission')
      .orderBy('taskSubmission.createdAt', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('taskSubmission.evaluation', 'evaluation')
      .leftJoin('taskSubmission.student', 'student')
      .leftJoin('taskSubmission.attachments', 'attachments')
      .where('taskSubmission.taskId = :taskId', { taskId: queryDto.taskId })

    applySelectColumns(queryBuilder, taskSubmissionSelectCols, 'taskSubmission')

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(TaskSubmission).findOne({
      where: { id },
      relations: {
        attachments: true,
        student: true,
      },
      select: taskSubmissionSelectCols,
    });

    if (!existing) throw new NotFoundException('Task submission not found');

    return existing;
  }

  async update(id: string, updateTaskSubmissionDto: UpdateTaskSubmissionDto) {
    const existing = await this.findOne(id);

    const attachments = !!updateTaskSubmissionDto.attachmentIds
      ? await this.filesService.findAllByIds(updateTaskSubmissionDto.attachmentIds, EFileMimeType.PDF)
      : existing.attachments;

    Object.assign(existing, {
      ...updateTaskSubmissionDto,
      attachments: attachments,
    });

    await this.getRepository(TaskSubmission).save(existing);

    return { message: 'Updated successfully' };
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.getRepository(TaskSubmission).remove(existing);

    return { message: 'Removed successfully' };
  }
}
