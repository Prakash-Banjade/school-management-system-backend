import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskSubmissionDto } from './dto/create-task-submission.dto';
import { UpdateTaskSubmissionDto } from './dto/update-task-submission.dto';
import { TaskSubmissionQueryDto } from './dto/task-submission-query.dto';
import { TaskSubmission } from './entities/task-submission.entity';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { taskSubmissionSelectCols } from './helpers/task-submission-select-cols.config';
import paginatedData from 'src/utils/paginatedData';
import { AuthUser, EFileMimeType, ETask, ETaskSubmissionStatus } from 'src/common/types/global.type';
import { FilesService } from 'src/file-management/files/files.service';
import { Task } from '../tasks/entities/task.entity';
import { Student } from 'src/students/entities/student.entity';
import { isStudent } from 'src/utils/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TaskSubmissionsService {
  @InjectRepository(Task) private readonly taskRepo: Repository<Task>;
  @InjectRepository(Student) private readonly studentRepo: Repository<Student>;
  @InjectRepository(TaskSubmission) private readonly taskSubmissionRepo: Repository<TaskSubmission>;
  constructor(
    private readonly filesService: FilesService
  ) { }

  async create(createTaskSubmissionDto: CreateTaskSubmissionDto, currentUser: AuthUser) {
    if (!isStudent(currentUser)) throw new NotFoundException('Access Denied');

    const student = await this.studentRepo.findOne({
      where: { id: currentUser.studentId },
      select: { id: true }
    });
    if (!student) throw new NotFoundException('Student not found');

    const task = await this.taskRepo.createQueryBuilder('task')
      .leftJoin('task.classRooms', 'classRoom')
      .leftJoin('task.submissions', 'submission', 'submission.studentId = :studentId', { studentId: student.id }) // Join task submissions by student ID
      .where('task.id = :taskId', { taskId: createTaskSubmissionDto.taskId }) // Get the task by ID
      .andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId }) // Ensure task is assigned to the student's classroom
      .andWhere('submission.id IS NULL') // Ensure no existing submission by this student
      .andWhere('task.taskType = :taskType', { taskType: ETask.ASSIGNMENT }) // only assignments are submitted, homework are not submitted
      .select(['task.id', 'task.deadline'])
      .getOne();

    if (!task) throw new NotFoundException('No such task found');

    const attachments = createTaskSubmissionDto.attachmentIds?.length
      ? await this.filesService.findAllByIds(createTaskSubmissionDto.attachmentIds)
      : [];

    if (createTaskSubmissionDto.attachmentIds?.length && !attachments.length) throw new NotFoundException('Attachments not found');

    const status = new Date(task.deadline) < new Date() ? ETaskSubmissionStatus.Late : ETaskSubmissionStatus.Submitted;

    const newSubmission = this.taskSubmissionRepo.create({
      ...createTaskSubmissionDto,
      student,
      attachments,
      task,
      status
    });

    await this.taskSubmissionRepo.save(newSubmission);

    return { message: 'Task submitted' };
  }

  findAll(queryDto: TaskSubmissionQueryDto) {
    if (!queryDto.taskId) throw new BadRequestException('Task ID is required');

    const queryBuilder = this.taskSubmissionRepo.createQueryBuilder('taskSubmission')
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
    const existing = await this.taskSubmissionRepo.findOne({
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

    await this.taskSubmissionRepo.save(existing);

    return { message: 'Updated successfully' };
  }
}
