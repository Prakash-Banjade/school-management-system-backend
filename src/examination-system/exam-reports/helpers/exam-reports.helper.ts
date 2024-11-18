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
            .andWhere('examType.id = :examTypeId', { examTypeId })

        const count = await queryBuilder.clone()
            .andWhere('CASE WHEN parent.id IS NULL THEN enrollmentClassRoom.id = :classRoomId ELSE parent.id = :classRoomId END', { classRoomId }) // ensure the student is also in the same classRoom
            .select([
                'COUNT(DISTINCT CASE WHEN examReport.theoryOM >= examSubject.theoryPM AND examReport.practicalOM >= examSubject.practicalPM THEN examReport.id ELSE NULL END) as totalPassed',
                'COUNT(DISTINCT CASE WHEN examReport.theoryOM < examSubject.theoryPM OR examReport.practicalOM < examSubject.practicalPM THEN examReport.id ELSE NULL END) as totalFailed',
                'COUNT(DISTINCT CASE WHEN examReport.theoryOM >= examSubject.theoryPM THEN examReport.id END) as theoryPassed',
                'COUNT(DISTINCT CASE WHEN examReport.theoryOM < examSubject.theoryPM THEN examReport.id END) as theoryFailed',
                'COUNT(DISTINCT CASE WHEN examReport.practicalOM >= examSubject.practicalPM THEN examReport.id END) as practicalPassed',
                'COUNT(DISTINCT CASE WHEN examReport.practicalOM < examSubject.practicalPM THEN examReport.id END) as practicalFailed',
            ]).getRawOne();

        const examSubject = await queryBuilder.clone()
            .select([
                'examSubject.theoryFM as theoryFM',
                'examSubject.theoryPM as theoryPM',
                'examSubject.practicalFM as practicalFM',
                'examSubject.practicalPM as practicalPM',
                'subject.subjectName as subjectName',
            ]).getRawOne();

        const reportQueryBuilder = queryBuilder
            .orderBy('examReport.percentage', 'DESC')
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                if (queryDto.sectionId && queryDto.sectionId !== 'all') {
                    qb.andWhere('CASE WHEN parent.id IS NULL THEN 0 ELSE enrollmentClassRoom.id = :sectionId END', { sectionId: queryDto.sectionId }) // if sectionId is provided look in the class room the student is if it's a section
                } else {
                    qb.andWhere('CASE WHEN parent.id IS NULL THEN enrollmentClassRoom.id = :classRoomId ELSE parent.id = :classRoomId END', { classRoomId }) // ensure the student is also in the same classRoom
                }
            }))
            .select([
                'examReport.id as id',
                'examReport.theoryOM as theoryOM',
                'examReport.practicalOM as practicalOM',
                'examReport.percentage as percentage',
                'examReport.gpa as gpa',
                'examReport.grade as grade',
                'student.id as studentId',
                'enrollment.rollNo as rollNo',
                'CONCAT(student.firstName, \' \', student.lastName) as fullName',
                'CASE WHEN parent.id IS NULL THEN enrollmentClassRoom.name ELSE CONCAT(parent.name, \' - \' , enrollmentClassRoom.name) END as classRoomName',
                `CASE WHEN examReport.theoryOM >= examSubject.theoryPM AND examReport.practicalOM >= examSubject.practicalPM THEN 'PASS' ELSE 'FAIL' END as status`
            ])

        const itemCount = await reportQueryBuilder.getCount();
        const data = await reportQueryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

        return {
            data,
            count,
            examSubject,
            meta: pageMetaDto
        }
    }
}