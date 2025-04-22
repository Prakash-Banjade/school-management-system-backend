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
            .leftJoin("teacher.assignedSubjects", "assignedSubjects")
            .leftJoin("assignedSubjects.classRoom", "classRoom")
            .andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.parentClassId ?? currentUser.classRoomId })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere(new Brackets(qb => {
                    qb.orWhere("account.lowerCasedFullName LIKE LOWER(:search)", { search: `${queryDto.search}%` })
                }))
            }))
            .select([
                'teacher.teacherId as teacherId',
                'CONCAT(teacher.firstName, \' \', teacher.lastName) as teacherFullName',
                'teacher.email as email',
                'teacher.phone as phone',
                'profileImage.url as profileImageUrl',
                'JSON_ARRAYAGG(JSON_OBJECT("subjectId", assignedSubjects.id, "subjectName", assignedSubjects.subjectName)) as subjects',
            ])
            .groupBy('teacher.id');

        return paginatedRawData(queryDto, queryBuilder);
    }
}