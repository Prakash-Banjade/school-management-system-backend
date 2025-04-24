import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskEvaluationDto } from './dto/create-task-evaluation.dto';
import { UpdateTaskEvaluationDto } from './dto/update-task-evaluation.dto';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskEvaluation } from './entities/task-evaluation.entity';
import { TaskSubmission } from '../task-submissions/entities/task-submission.entity';
import { AuthUser } from 'src/common/types/global.type';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { TaskEvaluationQueryDto } from './dto/task-evaluation-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { isStudent } from 'src/utils/utils';

@Injectable()
export class TaskEvaluationsService {
  constructor(
    @InjectRepository(TaskEvaluation) private readonly taskEvaluationRepo: Repository<TaskEvaluation>,
    @InjectRepository(TaskSubmission) private readonly taskSubmissionRepo: Repository<TaskSubmission>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
  ) { }

  async create(dto: CreateTaskEvaluationDto, currentUser: AuthUser) {
    const teacher = await this.teacherRepo.findOne({
      where: {
        account: { id: currentUser.accountId }
      },
      select: { id: true }
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const taskSubmission = await this.taskSubmissionRepo.createQueryBuilder('submission')
      .leftJoin('submission.task', 'task')
      .leftJoin('task.subject', 'subject')
      .innerJoin('subject.teachers', 'teacher', 'teacher.id = :teacherId', { teacherId: teacher.id })
      .where('submission.id = :submissionId', { submissionId: dto.taskSubmissionId })
      .select([
        'submission.id',
        'task.id',
        'task.marks',
      ])
      .getOne();

    if (dto.score > taskSubmission.task.marks) throw new NotFoundException('Invalid score. Score cannot be greater than task marks');

    const taskEvaluation = this.taskEvaluationRepo.create({
      ...dto,
      submission: taskSubmission,
      evaluator: teacher
    });

    await this.taskEvaluationRepo.save(taskEvaluation);

    return { message: 'Task evaluation created' }
  }

  findAll(queryDto: TaskEvaluationQueryDto, currentUser: AuthUser) {
    const querybuilder = this.taskEvaluationRepo.createQueryBuilder('taskEvaluation')
      .orderBy('taskEvaluation.createdAt', queryDto.order)
      .take(queryDto.take)
      .skip(queryDto.skip)
      .leftJoin('taskEvaluation.submission', 'submission')
      .leftJoin('submission.task', 'task')
      .leftJoin('task.subject', 'subject')
      .leftJoin('taskEvaluation.evaluator', 'evaluator')
      .where(new Brackets(qb => {
        queryDto.taskId && qb.andWhere('task.id = :taskId', { taskId: queryDto.taskId });
        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
      }))
      .andWhere(new Brackets(qb => {
        if (isStudent(currentUser)) {
          qb.andWhere('submission.studentId = :studentId', { studentId: currentUser.studentId });
        }
      }))
      .select([
        'taskEvaluation.id',
        'taskEvaluation.score',
        'taskEvaluation.feedback',
        'taskEvaluation.createdAt',
        'submission.id', 
        'submission.createdAt',
        'task.id',
        'task.title',
        'task.marks',
        'evaluator.id',
        'evaluator.firstName',
        'evaluator.lastName',
        'subject.id',
        'subject.subjectName',
      ]);

    return paginatedData(queryDto, querybuilder);
  }

  findOne(id: number) {
    return `This action returns a #${id} taskEvaluation`;
  }

  update(id: number, dto: UpdateTaskEvaluationDto) {
    return `This action updates a #${id} taskEvaluation`;
  }
}
