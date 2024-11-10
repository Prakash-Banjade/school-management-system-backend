import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { TeacherQueryDto } from "./dto/teacher-query.dto";
import { AuthUser } from "src/common/types/global.type";
import { isStudent } from "src/utils/isStudent";
import { Teacher } from "./entities/teacher.entity";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";

@Injectable()
export class TeachersStudentViewService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    ) { super(dataSource, req) }

    async findAll(queryDto: TeacherQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException();

        const queryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher');

        queryBuilder
            .orderBy("teacher.createdAt", queryDto.order)
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .leftJoin("teacher.profileImage", "profileImage")
            .leftJoin('teacher.assignedSubjects', 'assignedSubjects')
            .leftJoin('assignedSubjects.classRoom', '') 
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
}