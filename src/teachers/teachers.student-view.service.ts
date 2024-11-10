import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { TeacherQueryDto } from "./dto/teacher-query.dto";
import { AuthUser, EClassType } from "src/common/types/global.type";
import { isStudent } from "src/utils/isStudent";
import { Teacher } from "./entities/teacher.entity";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";

@Injectable()
export class TeachersStudentViewService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    ) { super(dataSource, req) }

    async findAll(queryDto: TeacherQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException();

        const queryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher');

        // this is done because student can be in primary or section class and the teacher can teach in both
        const primaryClassRoomId = await this.getPrimaryClassRoomId(currentUser.classRoomId);

        queryBuilder
            .orderBy("teacher.createdAt", queryDto.order)
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .leftJoin("teacher.profileImage", "profileImage")
            .leftJoin('teacher.assignedSubjects', 'assignedSubjects')
            .leftJoin('assignedSubjects.classRoom', 'classRoom')
            .where('classRoom.id = :primaryClassRoomId', { primaryClassRoomId })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere(new Brackets(qb => {
                    qb.orWhere("LOWER(CONCAT(teacher.firstName, ' ', teacher.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                    qb.orWhere("LOWER(teacher.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                }))

                queryDto.teacherId && qb.andWhere('teacher.teacherId = :teacherId', { teacherId: queryDto.teacherId });
            }))
            .select([
                'teacher.teacherId as teacherId',
                'CONCAT(teacher.firstName, \' \', teacher.lastName) as teacherFullName',
                'teacher.email as email',
                'teacher.phone as phone',
                'profileImage.url as profileImageUrl',
                'assignedSubjects.subjectName as subject',
            ])

        const itemCount = await queryBuilder.getCount();

        const data = await queryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return new PageDto(data, pageMetaDto);
    }


    private async getPrimaryClassRoomId(classRoomId: string) {
        const classRoom = await this.getRepository(ClassRoom).findOne({
            where: {
                id: classRoomId,
            },
            relations: {
                parent: true,
            },
            select: {
                id: true,
                classType: true,
                parent: {
                    id: true,
                }
            }
        })
        if (!classRoom) throw new NotFoundException('Class room not found');

        return classRoom.classType === EClassType.PRIMARY
            ? classRoom.id
            : classRoom.parent.id;
    }
}