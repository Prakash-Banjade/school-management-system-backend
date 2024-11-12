import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { ExamReport } from "../entities/exam-report.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { CACHE_KEYS } from "src/common/CONSTANTS";
import { ExamReportBySubjectQueryDto } from "../dto/exam-report-query.dto";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";

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
            .leftJoin('examSubject.subject', 'subject')
            .leftJoin('examSubject.exam', 'exam')
            .leftJoin('exam.classRoom', 'classRoom')
            .leftJoin('exam.examType', 'examType')
            .leftJoin('student.enrollments', 'enrollment')
            .leftJoin('enrollment.classRoom', 'enrollmentClassRoom')
            .leftJoin('enrollmentClassRoom.parent', 'parent')
            .where('exam.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
            .andWhere("enrollment.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .andWhere('examReport.examSubjectId = :examSubjectId', { examSubjectId })
            .andWhere('exam.classRoomId = :classRoomId', { classRoomId })
            .andWhere('CASE WHEN parent.id IS NULL THEN enrollmentClassRoom.id = :classRoomId ELSE parent.id = :classRoomId END', { classRoomId })
            .andWhere('examType.id = :examTypeId', { examTypeId })

        const count = await queryBuilder.clone()
            .select([
                'COUNT(DISTINCT CASE WHEN examReport.obtainedMarks >= examSubject.passMark THEN examReport.id END) as totalPassed',
                'COUNT(DISTINCT CASE WHEN examReport.obtainedMarks < examSubject.passMark THEN examReport.id END) as totalFailed',
            ]).getRawOne();

        const reportQueryBuilder = await queryBuilder
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                queryDto.sectionId && queryDto.sectionId !== 'all' && qb.andWhere('CASE WHEN parent.id IS NULL THEN 0 ELSE enrollmentClassRoom.id = :sectionId END', { sectionId: queryDto.sectionId })
            }))
            .select([
                'examReport.id as id',
                'examReport.obtainedMarks as obtainedMarks',
                'examReport.percentage as percentage',
                'examReport.gpa as gpa',
                'examReport.grade as grade',
                'examSubject.fullMark as fullMark',
                'examSubject.passMark as passMark',
                'subject.subjectName as subjectName',
                'student.id as studentId',
                'enrollment.rollNo as rollNo',
                'CONCAT(student.firstName, \' \', student.lastName) as fullName',
                'CASE WHEN parent.id IS NULL THEN enrollmentClassRoom.name ELSE CONCAT(parent.name, \' - \' , enrollmentClassRoom.name) END as classRoomName',
            ])

        const itemCount = await reportQueryBuilder.getCount();
        const data = await reportQueryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return {
            data,
            count,
            meta: pageMetaDto
        }
    }
}