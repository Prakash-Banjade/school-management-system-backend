import { Injectable } from "@nestjs/common";
import { TaskSubmission } from "./entities/task-submission.entity";
import { Brackets, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthUser, ETask } from "src/common/types/global.type";
import { isStudent } from "src/utils/utils";
import paginatedData from "src/utils/paginatedData";
import { TaskSubmissionQueryDto } from "./dto/task-submission-query.dto";

@Injectable()
export class TaskSubmissionsStudentViewService {
    constructor(
        @InjectRepository(TaskSubmission) private readonly taskSubmissionRepo: Repository<TaskSubmission>
    ) { }

    findAll(queryDto: TaskSubmissionQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) return;

        const queryBuilder = this.taskSubmissionRepo.createQueryBuilder('taskSubmission')
            .orderBy('taskSubmission.createdAt', queryDto.order)
            .take(queryDto.take)
            .skip(queryDto.skip)
            .leftJoin('taskSubmission.task', 'task')
            .leftJoin('task.subject', 'subject')
            .leftJoin('taskSubmission.attachments', 'attachments')
            .where('taskSubmission.studentId = :studentId', { studentId: currentUser.studentId })

        if (queryDto.evaluated === "true") {
            queryBuilder.innerJoin('taskSubmission.evaluation', 'evaluation', 'evaluation.id IS NOT NULL')
        }

        if (queryDto.evaluated === "false") {
            queryBuilder.leftJoin('taskSubmission.evaluation', 'evaluation')
                .andWhere('evaluation.id IS NULL')
        }

        queryBuilder
            .select([
                'taskSubmission.id',
                'taskSubmission.note',
                'taskSubmission.createdAt',
                'taskSubmission.status',
                'attachments.id',
                'attachments.url',
                'attachments.originalName',
                'task.id',
                'task.title',
                'task.deadline',
                'subject.id',
                'subject.subjectName',
                'subject.subjectCode'
            ]);

        return paginatedData(queryDto, queryBuilder);
    }
}