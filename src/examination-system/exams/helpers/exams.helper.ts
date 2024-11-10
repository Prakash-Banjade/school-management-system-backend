import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Cache } from "cache-manager";
import { FastifyRequest } from "fastify";
import { CACHE_KEYS } from "src/common/CONSTANTS";
import { BaseRepository } from "src/common/repository/base-repository";
import { StudentQueryDto } from "src/students/dto/student-query.dto";
import { Student } from "src/students/entities/student.entity";
import { Brackets, DataSource } from "typeorm";
import { Exam } from "../entities/exam.entity";
import { EClassType } from "src/common/types/global.type";

@Injectable()
export class ExamsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource,
        @Inject(REQUEST) req: FastifyRequest,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(dataSource, req) }

    async getExamStudents(examId: string, queryDto: StudentQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const exam = await this.getRepository<Exam>(Exam).findOne({
            where: { id: examId },
            relations: ['classRoom'],
            select: {
                id: true,
                classRoom: {
                    id: true,
                    classType: true,
                }
            }
        });

        if (!exam) throw new BadRequestException('Exam not found');

        const querybuilder = this.getRepository<Student>(Student).createQueryBuilder('student')
            .where("FIND_IN_SET(:academicYearId, student.academicYearIds) > 0", { academicYearId: currentAcademicYearId })
            .addSelect("CONCAT(student.firstName, ' ', student.lastName) AS fullName")
            .orderBy('student.rollNo', 'ASC')
            .leftJoin('student.classRoom', 'classRoom')
            .leftJoin('student.profileImage', 'profileImage')
            .leftJoin('classRoom.parent', 'parent')
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(qb => {
                        qb.orWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                        qb.orWhere("LOWER(student.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                    }))
                }

                exam.classRoom.classType === EClassType.PRIMARY && qb.andWhere(new Brackets(qb => { // if class room is primary, we are also checking if the parent classroom matches
                    qb.orWhere('parent.id = :classRoomId', { classRoomId: exam.classRoom.id });
                    qb.orWhere('classRoom.id = :classRoomId', { classRoomId: exam.classRoom.id });
                }));
                exam.classRoom.classType === EClassType.SECTION && qb.andWhere('classRoom.id = :sectionId', { sectionId: exam.classRoom.id });
                
                queryDto.studentId && qb.andWhere('student.studentId = :studentId', { studentId: queryDto.studentId });
            }))
            .select([
                "student.id as id",
                "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
                "student.rollNo as rollNo",
                "profileImage.url as profileImageUrl",
                // "student.studentId as studentId",
            ])

        return querybuilder.getRawMany();
    }
}