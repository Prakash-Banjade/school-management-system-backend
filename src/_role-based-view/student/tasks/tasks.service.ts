import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/common/dto/page.dto.';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { AuthUser } from 'src/common/types/global.type';
import { TaskQueryDto } from 'src/task-system/tasks/dto/task-query.dto';
import { Task } from 'src/task-system/tasks/entities/task.entity';
import { isStudent } from 'src/utils/isStudent';
import { Brackets, Repository } from 'typeorm';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    ) { }

    async findAll(queryDto: TaskQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) return;

        const queryBuilder = this.taskRepository.createQueryBuilder('task');

        queryBuilder
            .orderBy("task.createdAt", queryDto.order)
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .leftJoin('task.subject', 'subject')
            .leftJoin('task.classRooms', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .andWhere(new Brackets(qb => {
                if (queryDto.classRoomId) {
                    qb.andWhere(new Brackets(qb => {
                        qb.orWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId });
                        qb.orWhere('parent.id = :classRoomId', { classRoomId: currentUser.classRoomId });
                    }))
                }

                queryDto.search && qb.andWhere("LOWER(task.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });
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
        const data = await queryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return new PageDto(data, pageMetaDto);
    }
}
