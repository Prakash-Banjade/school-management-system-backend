import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassRoom } from "../entities/class-room.entity";
import { Brackets, DataSource, Repository } from "typeorm";
import { EClassType, Gender } from "src/common/types/global.type";
import { applySelectColumns } from "src/utils/apply-select-cols";
import { classRoomOptionsSelectCols } from "./class-room-select-cols.config";
import paginatedData from "src/utils/paginatedData";
import { ClassRoomOptionsQueryDto, ClassRoomQueryDto } from "../dto/classRoom-query.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { CACHE_KEYS } from "src/common/CONSTANTS";
import { BaseRepository } from "src/common/repository/base-repository";
import { FastifyRequest } from "fastify";
import { REQUEST } from "@nestjs/core";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";

@Injectable()
export class ClassRoomsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @InjectRepository(ClassRoom) private readonly classRoomRepo: Repository<ClassRoom>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(dataSource, req); }

    async findAll(queryDto: ClassRoomQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const queryBuilder = this.classRoomRepo.createQueryBuilder('classRoom')
            .where('classRoom.classType = :classType', { classType: queryDto.classType })
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere('LOWER(classRoom.name) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
                queryDto.parentClassId && qb.andWhere('classRoom.parentId = :parentClassId', { parentClassId: queryDto.parentClassId })
            }))
            .orderBy("classRoom.createdAt", queryDto.order)
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin('classRoom.classTeacher', 'classTeacher')
            .leftJoin('classRoom.students', 'student', 'FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0', { currentAcademicYearId })
            .leftJoin('classRoom.children', 'childClass')
            .leftJoin('childClass.students', 'childClassStudent', 'FIND_IN_SET(:currentAcademicYearId, childClassStudent.academicYearIds) > 0', { currentAcademicYearId })
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
                'COUNT(DISTINCT student.id) + COUNT(DISTINCT childClassStudent.id) AS totalStudentsCount',
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.MALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.MALE}' THEN childClassStudent.id END) AS totalMaleStudentsCount`,
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.FEMALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.FEMALE}' THEN childClassStudent.id END) AS totalFemaleStudentsCount`
            ])
            .groupBy('classRoom.id')  // Ensure group by to aggregate counts per classRoom

        const itemCount = await queryBuilder.getCount();
        const data = await queryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return new PageDto(data, pageMetaDto);
    }

    async getClassRoomsOptions(queryDto: ClassRoomOptionsQueryDto) {
        const queryBuilder = this.classRoomRepo.createQueryBuilder('classRoom');

        queryBuilder
            .orderBy("classRoom.createdAt", queryDto.order)
            .skip(queryDto.skipPagination ? undefined : queryDto.skip)
            .take(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin("classRoom.children", "children")
            .where('classRoom.classType = :classType', { classType: EClassType.PRIMARY })
            .andWhere(new Brackets(qb => {
                queryDto.classRoomId && qb.andWhere("classRoom.id = :search", { search: queryDto.search })
                queryDto.search && qb.andWhere("LOWER(classRoom.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
            }))

        applySelectColumns(queryBuilder, classRoomOptionsSelectCols, 'classRoom');

        return paginatedData(queryDto, queryBuilder);
    }

    // this is used in single class room page in frontend
    async getClassRoomDetails(id: string) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const classRoomQueryBuilder = this.classRoomRepo.createQueryBuilder('classRoom')
            .where('classRoom.id = :classroomId', { classroomId: id }) // Filter by specific classroom ID
            .leftJoin('classRoom.classTeacher', 'classTeacher')
            .leftJoin('classRoom.students', 'student', 'FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0', { currentAcademicYearId })
            .leftJoin('classRoom.children', 'childClass')
            .leftJoin('childClass.students', 'childClassStudent', 'FIND_IN_SET(:currentAcademicYearId, childClassStudent.academicYearIds) > 0', { currentAcademicYearId })
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
            .addSelect([
                'COUNT(DISTINCT student.id) + COUNT(DISTINCT childClassStudent.id) AS totalStudentsCount',
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.MALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.MALE}' THEN childClassStudent.id END) AS totalMaleStudentsCount`,
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.FEMALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.FEMALE}' THEN childClassStudent.id END) AS totalFemaleStudentsCount`
            ])

        return classRoomQueryBuilder.getRawOne();
    }
}