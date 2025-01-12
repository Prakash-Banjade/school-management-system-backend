import { Inject, Injectable } from "@nestjs/common";
import { ClassRoom } from "../entities/class-room.entity";
import { Brackets, DataSource } from "typeorm";
import { EClassType, Gender, Role } from "src/common/types/global.type";
import { applySelectColumns } from "src/utils/apply-select-cols";
import { classRoomOptionsSelectCols } from "./class-room-select-cols.config";
import { paginatedRawData } from "src/utils/paginatedData";
import { ClassRoomOptionsQueryDto, ClassRoomQueryDto } from "../dto/classRoom-query.dto";
import { BaseRepository } from "src/common/repository/base-repository";
import { FastifyRequest } from "fastify";
import { REQUEST } from "@nestjs/core";
import { UtilitiesService } from "src/utilities/utilities.service";
import { QueryDto } from "src/common/dto/query.dto";

@Injectable()
export class ClassRoomsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) { super(dataSource, req); }

    async findAll(queryDto: ClassRoomQueryDto) {
        const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();

        const queryBuilder = this.getRepository(ClassRoom).createQueryBuilder('classRoom')
            .where('classRoom.classType = :classType', { classType: queryDto.classType })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere('LOWER(classRoom.name) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
                queryDto.parentClassId && qb.andWhere('classRoom.parentId = :parentClassId', { parentClassId: queryDto.parentClassId })
                queryDto.degreeLevel && qb.andWhere('faculty.degreeLevel = :degreeLevel', { degreeLevel: queryDto.degreeLevel })
                queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId })
            }))
            .orderBy("classRoom.createdAt", queryDto.order)
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin('classRoom.classTeacher', 'classTeacher')
            .leftJoin('classRoom.students', 'student', 'FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0', { currentAcademicYearId })
            .leftJoin('classRoom.children', 'childClass')
            .leftJoin('classRoom.parent', 'parentClass', queryDto.classType === EClassType.SECTION ? '1 = 1' : '1 = 0')
            .leftJoin('childClass.students', 'childClassStudent', 'FIND_IN_SET(:currentAcademicYearId, childClassStudent.academicYearIds) > 0', { currentAcademicYearId })
            .leftJoin('childClass.classTeacher', 'childClassTeacher')
            .leftJoin('classRoom.faculty', 'faculty')
            .select([
                "classRoom.id as id",
                "classRoom.name as name",
                "classRoom.description as description",
                "classRoom.location as location",
                "classRoom.classType as classType",
                "classTeacher.id as classTeacherId",
                "faculty.name as faculty",
                "CONCAT(classTeacher.firstName, ' ', classTeacher.lastName) as classTeacherName",
                'parentClass.name as parentClassName',
                `(SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'teacherName', CONCAT(childClassTeacher.firstName, ' ', childClassTeacher.lastName),
                      'className', childClass.name
                    )
                  )
                  FROM class_room childClass
                  LEFT JOIN teacher childClassTeacher ON childClass.classTeacherId = childClassTeacher.id
                  WHERE childClass.parentId = classRoom.id
                  AND childClassTeacher.id IS NOT NULL
                ) as childClassTeachers`,
            ])
            .addSelect([
                'COUNT(DISTINCT student.id) + COUNT(DISTINCT childClassStudent.id) AS totalStudentsCount',
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.MALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.MALE}' THEN childClassStudent.id END) AS totalMaleStudentsCount`,
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.FEMALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.FEMALE}' THEN childClassStudent.id END) AS totalFemaleStudentsCount`
            ])
            .groupBy('classRoom.id')  // Ensure group by to aggregate counts per classRoom
            .addGroupBy('parentClass.name')

        this.utilitiesService.applyBranchFilter(queryBuilder, "classRoom.branchId = :branchId");

        return paginatedRawData(queryDto, queryBuilder);
    }

    async getClassRoomsOptions(queryDto: ClassRoomOptionsQueryDto) {
        const { accountId, role } = this.utilitiesService.getCurrentUser();

        const queryBuilder = this.getRepository(ClassRoom).createQueryBuilder('classRoom');

        queryBuilder
            .orderBy("classRoom.createdAt", queryDto.order)
            .skip(queryDto.skipPagination ? undefined : queryDto.skip)
            .take(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin("classRoom.children", "children", queryDto.onlyPrimaryClass ? '1 = 0' : '1 = 1')
            .where('classRoom.classType = :classType', { classType: EClassType.PRIMARY })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(classRoom.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
            }))

        if (role === Role.TEACHER) {
            queryBuilder
                .leftJoin('classRoom.classRoutines', 'classRoutine')
                .leftJoin('children.classRoutines', 'childrenClassRoutine')
                .leftJoin('classRoutine.teacher', 'teacher')
                .leftJoin('childrenClassRoutine.teacher', 'childrenRoutineTeacher')
                .andWhere('teacher.accountId = :accountId OR childrenRoutineTeacher.accountId = :accountId', { accountId });
        }

        applySelectColumns(
            queryBuilder,
            queryDto.onlyPrimaryClass ? {
                id: true,
                name: true,
                createdAt: true,
            } : classRoomOptionsSelectCols,
            'classRoom'
        );

        this.utilitiesService.applyBranchFilter(queryBuilder, "classRoom.branchId = :branchId");

        return queryBuilder.getMany();
    }

    // this is used in single class room page in frontend
    async getClassRoomDetails(id: string) {
        const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();

        return this.getRepository(ClassRoom).createQueryBuilder('classRoom')
            .where('classRoom.id = :classroomId', { classroomId: id }) // Filter by specific classroom ID
            .leftJoin('classRoom.classTeacher', 'classTeacher')
            .leftJoin('classRoom.students', 'student', 'FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0', { currentAcademicYearId })
            .leftJoin('classRoom.children', 'childClass')
            .leftJoin('childClass.students', 'childClassStudent', 'FIND_IN_SET(:currentAcademicYearId, childClassStudent.academicYearIds) > 0', { currentAcademicYearId })
            .select([
                'classRoom.id as id',
                'classRoom.name as name',
                'classRoom.description as description',
                'classRoom.location as location',
                'classRoom.classType as classType',
                'classRoom.createdAt as createdAt',
                'classRoom.updatedAt as updatedAt',
                'CONCAT(classTeacher.firstName, \' \', classTeacher.lastName) as classTeacherName',
            ])
            // Add aggregate student count fields
            .addSelect([
                'COUNT(DISTINCT student.id) + COUNT(DISTINCT childClassStudent.id) AS totalStudentsCount',
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.MALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.MALE}' THEN childClassStudent.id END) AS totalMaleStudentsCount`,
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.FEMALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.FEMALE}' THEN childClassStudent.id END) AS totalFemaleStudentsCount`
            ]).getRawOne();
    }

    // used in teacher panel
    async getMyAssignedClasses(queryDto: QueryDto) {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const queryBuilder = this.getRepository(ClassRoom).createQueryBuilder('classRoom')
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .orderBy("classRoom.createdAt", queryDto.order)
            .leftJoin('classRoom.classRoutines', 'classRoutine')
            .leftJoin('classRoutine.teacher', 'teacher')
            .leftJoin('classRoutine.subject', 'subject')
            .leftJoin('classRoom.parent', 'parent')
            .where('teacher.accountId = :accountId', { accountId })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(classRoom.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
            }))
            .select([
                'classRoom.id as id',
                'CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, \' - \', classRoom.name) END as name',
                'subject.id as subjectId',
                'subject.subjectName as subjectName',
            ]);

        return paginatedRawData(queryDto, queryBuilder);
    }
}