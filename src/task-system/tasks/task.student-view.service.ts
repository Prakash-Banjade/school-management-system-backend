import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Task } from "./entities/task.entity";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";
import { ETaskCategory, TaskQueryDto } from "./dto/task-query.dto";
import { AuthUser } from "src/common/types/global.type";
import { isStudent } from "src/utils/utils";
import { paginatedRawData } from "src/utils/paginatedData";

@Injectable()
export class TaskStudentViewService {
    constructor(
        @InjectRepository(Task) private readonly taskRepository: Repository<Task>
    ) { }

    async findAll(queryDto: TaskQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException('Access Denied');

        const queryBuilder = this.taskRepository.createQueryBuilder('task');

        queryBuilder
            .orderBy("task.createdAt", queryDto.order)
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .leftJoin('task.subject', 'subject')
            .leftJoin('task.attachments', 'attachments')
            .leftJoin('task.classRooms', 'classRoom')
            .leftJoin('task.submissions', 'submission', 'submission.studentId = :studentId', { studentId: currentUser.studentId })
            .leftJoin('submission.evaluation', 'evaluation')
            .where('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(task.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });

                queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
                queryDto.taskType && qb.andWhere('task.taskType = :taskType', { taskType: queryDto.taskType });
            }))
            .andWhere(new Brackets(qb => {
                if (queryDto.category === ETaskCategory.PENDING) {
                    qb.andWhere('submission.id IS NULL');
                }

                if (queryDto.category === ETaskCategory.SUBMITTED) {
                    qb.andWhere('submission.id IS NOT NULL && evaluation.id IS NULL');
                }

                if (queryDto.category === ETaskCategory.EVALUATED) {
                    qb.andWhere('evaluation.id IS NOT NULL');
                }
            }))
            .select([
                "task.id as id",
                "task.title as title",
                "task.description as description",
                "task.deadline as deadline",
                "task.taskType as taskType",
                "task.marks as marks",
                "task.createdAt as createdAt",
                "subject.subjectName as subjectName",
                `JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', attachments.id,
                        'originalName', attachments.originalName,
                        'url', attachments.url
                    )
                ) as attachments`,
            ])
            .groupBy("task.id");

        return paginatedRawData(queryDto, queryBuilder);
    }

    async getCounts(queryDto: TaskQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException('Access Denied');

        const counts = await this.taskRepository.createQueryBuilder('task')
            .leftJoin('task.submissions', 'submission', 'submission.studentId = :studentId', { studentId: currentUser.studentId })
            .leftJoin('submission.evaluation', 'evaluation')
            .leftJoin('task.classRooms', 'classRooms')
            .where('classRooms.id = :classRoomId', { classRoomId: currentUser.classRoomId })
            .andWhere(new Brackets(qb => {
                if (queryDto.taskType) {
                    qb.andWhere('task.taskType = :taskType', { taskType: queryDto.taskType });
                }
            }))
            .select([
                `COUNT(CASE WHEN submission.id IS NULL THEN 1 END) AS "pending"`,
                `COUNT(CASE WHEN submission.id IS NOT NULL AND evaluation.id IS NULL THEN 1 END) AS "submitted"`,
                `COUNT(CASE WHEN evaluation.id IS NOT NULL THEN 1 END) AS "evaluated"`
            ])
            .getRawOne();

        return counts;
    }

}