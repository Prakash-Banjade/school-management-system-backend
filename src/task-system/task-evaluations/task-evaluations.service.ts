import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { isStudent, isTeacher } from 'src/utils/utils';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';

@Injectable()
export class TaskEvaluationsService {
  constructor(
    @InjectRepository(TaskEvaluation) private readonly taskEvaluationRepo: Repository<TaskEvaluation>,
    @InjectRepository(TaskSubmission) private readonly taskSubmissionRepo: Repository<TaskSubmission>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(ClassRoutine) private readonly classRoutineRepo: Repository<ClassRoutine>,
  ) { }

  async create(dto: CreateTaskEvaluationDto, currentUser: AuthUser) {
    if (!isTeacher(currentUser)) throw new NotFoundException('Access denied');

    const taskSubmission = await this.taskSubmissionRepo.createQueryBuilder('submission')
      .leftJoin('submission.task', 'task')
      .leftJoin('task.subject', 'subject')
      .innerJoin('subject.teachers', 'teacher', 'teacher.id = :teacherId', { teacherId: currentUser.teacherId })
      .where('submission.id = :submissionId', { submissionId: dto.taskSubmissionId })
      .select([
        'submission.id',
        'task.id',
        'task.marks',
      ])
      .getOne();

    if (dto.score > taskSubmission.task.marks) throw new NotFoundException('Invalid score. Score cannot be greater than task marks');

    const teacher = await this.teacherRepo.findOne({ where: { id: currentUser.teacherId }, select: { id: true } });

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

  findOne(id: string) {
    return `This action returns a #${id} taskEvaluation`;
  }

  async update(id: string, dto: UpdateTaskEvaluationDto, currentUser: AuthUser) {
    const existing = await this.taskEvaluationRepo.findOne({
      where: { id },
      relations: {
        submission: { task: { classRoom: true, subject: true } }
      },
      select: {
        id: true,
        submission: {
          id: true,
          task: {
            id: true,
            classRoom: { id: true },
            subject: { id: true }
          }
        }
      }
    });

    if (!existing) throw new NotFoundException('Task evaluation not found');

    if (isTeacher(currentUser)) { // if user is teacher, validate if he is allowed to update
      const task = existing.submission.task;

      const classRoutine = await this.classRoutineRepo.findOne({
        where: {
          classRoom: { id: task.classRoom.id },
          subject: { id: task.subject.id },
          teacher: { id: currentUser.teacherId }
        },
        select: { id: true }
      });

      if (!classRoutine) throw new ForbiddenException('Access denied');
    }

    await this.taskEvaluationRepo.update({ id }, dto);

    return { message: 'Task evaluation updated' };
  }
}
