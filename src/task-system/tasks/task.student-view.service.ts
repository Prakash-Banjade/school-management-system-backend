import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Task } from "./entities/task.entity";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";
import { TaskQueryDto } from "./dto/task-query.dto";
import { AuthUser } from "src/common/types/global.type";
import { selectTaskCols_student } from "./helpers/select-task-cols.config";
import { applySelectColumns } from "src/utils/apply-select-cols";
import { isStudent } from "src/utils/utils";

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
            .leftJoin('task.classRooms', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('task.attachments', 'attachments')
            .leftJoin('task.submissions', 'submissions', 'submissions.studentId = :studentId', { studentId: currentUser.studentId })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(task.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });

                // task of only the classroom the student belongs to
                qb.andWhere(new Brackets(qb => {
                    qb.orWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId });
                    qb.orWhere('parent.id = :classRoomId', { classRoomId: currentUser.classRoomId });
                }))

                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // section is the class room
                queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
                queryDto.taskType && qb.andWhere('task.taskType = :taskType', { taskType: queryDto.taskType });
                queryDto.overdue
                    ? qb.andWhere('DATE(task.deadline) < CURRENT_DATE()')
                    : qb.andWhere('DATE(task.deadline) >= CURRENT_DATE()');
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
                "JSON_ARRAYAGG(JSON_OBJECT('status', submissions.status)) as submission",
            ])
            .groupBy("task.id");

        const itemCount = await queryBuilder.getCount();
        const data = await queryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return new PageDto(data, pageMetaDto);
    }

    async findOne(id: string, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException('Access Denied');

        const querybuilder = this.taskRepository.createQueryBuilder('task')
            .leftJoin('task.subject', 'subject')
            .leftJoin('task.classRooms', 'classRooms')
            .leftJoin('classRooms.parent', 'parent')
            .leftJoin('task.setBy', 'setBy')
            .leftJoin('task.attachments', 'attachments')
            .leftJoin('task.submissions', 'submissions', 'submissions.studentId = :studentId', { studentId: currentUser.studentId })
            .leftJoin('submissions.attachments', 'submissionAttachments')
            .leftJoin('submissions.evaluation', 'evaluation')
            .where(new Brackets(qb => {
                qb.andWhere('task.id = :id', { id }); // filter by id

                qb.andWhere(new Brackets(qb => {
                    qb.orWhere('classRooms.id = :classRoomId', { classRoomId: currentUser.classRoomId });
                    qb.orWhere('parent.id = :classRoomId', { classRoomId: currentUser.classRoomId });
                }))
            }))

        applySelectColumns(querybuilder, selectTaskCols_student, 'task');

        const task = await querybuilder.getOne();

        if (!task) throw new NotFoundException(`Task with id ${id} not found`);
        return task;
    }

}