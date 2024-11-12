import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { DataSource } from "typeorm";
import { ExamReport } from "../entities/exam-report.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { CACHE_KEYS } from "src/common/CONSTANTS";
import { paginatedRawData } from "src/utils/paginatedData";
import { ExamReportBySubjectQueryDto } from "../dto/exam-report-query.dto";

@Injectable()
export class ExamReportsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(dataSource, req); }

    async getExamReportBySubject(queryDto: ExamReportBySubjectQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);
        const { classRoomId, examTypeId, examSubjectId } = queryDto;

        

        const queryBuilder = this.getRepository(ExamReport).createQueryBuilder('examReport')
            .orderBy('examReport.percentage', 'DESC')
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .leftJoin('examReport.student', 'student')
            .leftJoin('examReport.examSubject', 'examSubject')
            .leftJoin('examSubject.exam', 'exam')
            .leftJoin('exam.classRoom', 'classRoom')
            .leftJoin('exam.examType', 'examType')
            .leftJoin('student.enrollments', 'enrollment', "enrollment.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollment.classRoom', 'enrollmentClassRoom')
            .leftJoin('enrollmentClassRoom.parent', 'parent')
            .where('exam.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
            .where('examReport.examSubjectId = :examSubjectId', { examSubjectId })
            .andWhere('exam.classRoomId = :classRoomId', { classRoomId })
            .andWhere('examType.id = :examTypeId', { examTypeId })
            .select([
                'examReport.id as id',
                'examReport.obtainedMarks as obtainedMarks',
                'examReport.percentage as percentage',
                'examReport.gpa as gpa',
                'examReport.grade as grade',
                'examSubject.fullMark as fullMark',
                'examSubject.passMark as passMark',
                'student.id as studentId',
                'CONCAT(student.firstName, \' \', student.lastName) as fullName',
                'CASE WHEN parent.id IS NULL THEN enrollmentClassRoom.name ELSE CONCAT(parent.name, \' - \' , enrollmentClassRoom.name) END as classRoomName',

            ]);

        return paginatedRawData(queryDto, queryBuilder);
    }
}