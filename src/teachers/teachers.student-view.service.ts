import { ForbiddenException, Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import { TeacherQueryDto } from "./dto/teacher-query.dto";
import { AuthUser } from "src/common/types/global.type";
import { Teacher } from "./entities/teacher.entity";
import { isStudent } from "src/utils/utils";
import { paginatedRawData } from "src/utils/paginatedData";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class TeachersStudentViewService {
    constructor(
        @InjectRepository(Teacher) private readonly teachersRepo: Repository<Teacher>,
    ) { }

    async findAll(queryDto: TeacherQueryDto, currentUser: AuthUser) {
        if (!isStudent(currentUser)) throw new ForbiddenException();

        const queryBuilder = this.teachersRepo.createQueryBuilder('teacher');

        queryBuilder
            .orderBy("teacher.createdAt", queryDto.order)
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .leftJoin('teacher.account', 'account')
            .leftJoin("account.profileImage", "profileImage")
            .innerJoin("teacher.classRoutines", "classRoutines", 'classRoutines.classRoomId = :classRoomId', { classRoomId: currentUser.classRoomId })
            // .leftJoin("classRoutines.subject", "subject")
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere(new Brackets(qb => {
                    qb.orWhere("account.lowerCasedFullName LIKE LOWER(:search)", { search: `${queryDto.search}%` })
                }))
            }))
            .select([
                'teacher.id as teacherId',
                'CONCAT(teacher.firstName, \' \', teacher.lastName) as teacherFullName',
                'teacher.email as email',
                'teacher.phone as phone',
                'profileImage.url as profileImageUrl',
                // 'JSON_ARRAYAGG(JSON_OBJECT("subjectId", subject.id, "subjectName", subject.subjectName)) as subjects', // TODO: avoid duplicate subjects, for now it is done in frontend
            ])
            .cache(true)
            .groupBy('teacher.id');

        return paginatedRawData(queryDto, queryBuilder);
    }
}