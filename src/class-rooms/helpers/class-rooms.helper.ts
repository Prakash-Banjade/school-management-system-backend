import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassRoom } from "../entities/class-room.entity";
import { Brackets, Repository } from "typeorm";
import { QueryDto } from "src/common/dto/query.dto";
import { EClassType, Gender } from "src/common/types/global.type";
import { applySelectColumns } from "src/utils/apply-select-cols";
import { classRoomOptionsSelectCols } from "./class-room-select-cols.config";
import paginatedData from "src/utils/paginatedData";
import { ClassRoomQueryDto } from "../dto/classRoom-query.dto";

@Injectable()
export class ClassRoomsHelper {
    constructor(
        @InjectRepository(ClassRoom) private readonly classRoomRepo: Repository<ClassRoom>,
    ) { }

    setClassRoomQuery(queryDto: ClassRoomQueryDto) {
        return this.classRoomRepo.createQueryBuilder('classRoom')
            .orderBy("classRoom.createdAt", queryDto.order)
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin("classRoom.classTeacher", "classTeacher")
            .leftJoin("classRoom.parent", "classRoomParentClass")
            .leftJoin("classRoom.children", "childrenClasses")
            .leftJoin("classRoom.students", "students")
            .leftJoin('students.enrollments', 'enrollment')
            .leftJoin('enrollment.academicYear', 'academicYear', 'academicYear.isActive = true')  // Join only active academic year
            .leftJoin("childrenClasses.students", "childrenStudents")
            .leftJoin("childrenStudents.enrollments", "childrenEnrollment")
            .leftJoin("childrenEnrollment.academicYear", "childrenAcademicYear", "childrenAcademicYear.isActive = true") // Join only active academic year for children
            .select([
                "classRoom.id as id",
                "classRoom.name as name",
                "classRoom.description as description",
                "classRoom.monthlyTutionFee as monthlyTutionFee",
                "classRoom.monthlyFee as monthlyFee",
                "classRoom.location as location",
                "classRoom.classType as classType",
                "classTeacher.id as classTeacherId",
                "CONCAT(classTeacher.firstName, ' ', classTeacher.lastName) as classTeacherName",
            ])
            .addSelect([
                // Total student count (including children)
                "COUNT(DISTINCT CASE WHEN (academicYear.isActive = true OR childrenAcademicYear.isActive = true) THEN students.id ELSE childrenStudents.id END) AS totalStudentsCount",

                // Total male students (including children)
                `COUNT(DISTINCT CASE WHEN (students.gender = '${Gender.MALE}' OR childrenStudents.gender = '${Gender.MALE}') THEN students.id ELSE childrenStudents.id END) AS totalMaleStudentsCount`,

                // Total female students (including children)
                `COUNT(DISTINCT CASE WHEN (students.gender = '${Gender.FEMALE}' OR childrenStudents.gender = '${Gender.FEMALE}') THEN students.id ELSE childrenStudents.id END) AS totalFemaleStudentsCount`
            ])
            .groupBy('classRoom.id')  // Ensure group by to aggregate counts per classRoom
            .where('classRoom.classType = :classType', { classType: EClassType.PRIMARY })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere('LOWER(classRoom.name) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
            }));

    }

    setSectionsQuery(queryDto: ClassRoomQueryDto) {
        return this.classRoomRepo.createQueryBuilder('classRoom')
            .orderBy("classRoom.createdAt", queryDto.order)
            .skip(queryDto.skipPagination ? undefined : queryDto.skip)
            .take(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin("classRoom.students", "students")
            .leftJoin("classRoom.parent", "parent")
            // .leftJoin('students.enrollments', 'enrollment')
            // .leftJoin('enrollment.academicYear', 'academicYear')
            .groupBy('classRoom.id')  // Ensure group by to aggregate counts per classRoom
            .addSelect([
                "COUNT(DISTINCT students.id) AS totalStudentsCount",
                `COUNT(DISTINCT CASE WHEN students.gender = '${Gender.MALE}' THEN students.id END) AS totalMaleStudentsCount`,
                `COUNT(DISTINCT CASE WHEN students.gender = '${Gender.FEMALE}' THEN students.id END) AS totalFemaleStudentsCount`,
            ])
            .where('classRoom.classType = :classType', { classType: EClassType.SECTION })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere('LOWER(classRoom.name) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
                queryDto.parentClassId && qb.andWhere('parent.id = :parentClassId', { parentClassId: queryDto.parentClassId });
            }));
    }

    async getClassRoomsOptions(queryDto: QueryDto) {
        const queryBuilder = this.classRoomRepo.createQueryBuilder('classRoom');

        queryBuilder
            .orderBy("classRoom.createdAt", queryDto.order)
            .skip(queryDto.skipPagination ? undefined : queryDto.skip)
            .take(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin("classRoom.children", "children")
            .where('classRoom.classType = :classType', { classType: EClassType.PRIMARY })

        applySelectColumns(queryBuilder, classRoomOptionsSelectCols, 'classRoom');

        return paginatedData(queryDto, queryBuilder);
    }

    async getClassRoomDetails(id: string) {
        const queryBuilder = this.classRoomRepo.createQueryBuilder('classRoom')
            .where('classRoom.id = :classroomId', { classroomId: id }) // Filter by specific classroom ID
            .leftJoin('classRoom.classTeacher', 'classTeacher')
            .leftJoinAndSelect('classRoom.children', 'children') // Fetch child classes
            .leftJoin('classRoom.students', 'students')
            .leftJoin('students.enrollments', 'enrollment')
            .leftJoin('enrollment.academicYear', 'academicYear', 'academicYear.isActive = true') // Only active academic year
            .leftJoin('children.students', 'childrenStudents')
            .leftJoin('childrenStudents.enrollments', 'childrenEnrollment')
            .leftJoin('childrenEnrollment.academicYear', 'childrenAcademicYear', 'childrenAcademicYear.isActive = true') // Only active academic year for children
            .select([
                'classRoom.id as id',
                'classRoom.name as name',
                'classRoom.description as description',
                'classRoom.monthlyTutionFee as monthlyTutionFee',
                'classRoom.monthlyFee as monthlyFee',
                'classRoom.location as location',
                'classRoom.classType as classType',
                'classRoom.createdAt as createdAt',
                'classRoom.updatedAt as updatedAt',
                'CONCAT(classTeacher.firstName, \' \', classTeacher.lastName) as classTeacherName',
            ])
            // Add aggregate student count fields
            .addSelect('COUNT(DISTINCT students.id) + COUNT(DISTINCT childrenStudents.id)', 'totalStudentsCount')
            .addSelect(`COUNT(DISTINCT CASE WHEN students.gender = '${Gender.MALE}' THEN students.id END) + COUNT(DISTINCT CASE WHEN childrenStudents.gender = '${Gender.MALE}' THEN childrenStudents.id END)`, 'totalMaleStudentsCount')
            .addSelect(`COUNT(DISTINCT CASE WHEN students.gender = '${Gender.FEMALE}' THEN students.id END) + COUNT(DISTINCT CASE WHEN childrenStudents.gender = '${Gender.FEMALE}' THEN childrenStudents.id END)`, 'totalFemaleStudentsCount')
            .groupBy('classRoom.id');

        const classroomDetails = await queryBuilder.getRawOne();

        return classroomDetails;
    }

}