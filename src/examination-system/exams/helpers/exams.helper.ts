import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Cache } from "cache-manager";
import { FastifyRequest } from "fastify";
import { CACHE_KEYS } from "src/common/CONSTANTS";
import { BaseRepository } from "src/common/repository/base-repository";
import { Student } from "src/students/entities/student.entity";
import { Brackets, DataSource } from "typeorm";
import { Exam } from "../entities/exam.entity";
import { ExamReportsService } from "src/examination-system/exam-reports/exam-reports.service";
import { ExamStudentsQueryDto } from "../dto/exam-query.dto";
import { ESubjectType } from "src/common/types/global.type";

@Injectable()
export class ExamsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource,
        @Inject(REQUEST) req: FastifyRequest,
        private readonly examReportsService: ExamReportsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(dataSource, req) }

    async getExamStudents(examId: string, queryDto: ExamStudentsQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const exam = await this.getRepository<Exam>(Exam).findOne({
            where: { id: examId },
            relations: ['classRoom'],
            select: { id: true, classRoom: { id: true } }
        });

        if (!exam) throw new BadRequestException('Exam not found');

        const querybuilder = this.getRepository<Student>(Student).createQueryBuilder('student')
            .leftJoin('student.enrollments', 'enrollments', "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.optionalSubjects', 'optionalSubjects', 'optionalSubjects.classRoomId = :classRoomId', { classRoomId: exam.classRoom.id })
            .where('CASE WHEN parent.id IS NULL THEN classRoom.id ELSE parent.id END = :classRoomId', { classRoomId: exam.classRoom.id })
            .andWhere(new Brackets(qb => {
                queryDto.optionalSubjectId && qb.andWhere('optionalSubjects.subjectId = :optionalSubjectId', { optionalSubjectId: queryDto.optionalSubjectId });
            }))
            .select([
                "student.id as id",
                "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
                "enrollments.rollNo as rollNo",
            ])
            .orderBy('student.rollNo', 'ASC')
            .groupBy('student.id')
            .addGroupBy('enrollments.rollNo')

        return querybuilder.getRawMany();
    }

    async getExamReportByStudent(studentId: string, examTypeId: string) {
        if (!studentId) throw new BadRequestException('Student id is required'); // studentId is optional because student can request this api without student id
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const student = await this.getRepository(Student).createQueryBuilder('student')
            .where("student.studentId = :studentId OR student.id = :studentId", { studentId }) // the second condition of is due to when student request this api, we check of student.id from the currentUser
            .leftJoin('student.enrollments', 'enrollment', "enrollment.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollment.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.profileImage', 'profileImage')
            .leftJoin('student.optionalSubjects', 'optionalSubjects')
            .select([
                'student.id as id',
                'student.firstName as firstName',
                'student.lastName as lastName',
                'student.phone as phone',
                'student.email as email',
                'enrollment.rollNo as rollNo',
                'classRoom.id as classRoomId',
                'parent.id as parentClassId',
                'classRoom.name as classRoomName',
                'parent.name as parentClassName',
                'profileImage.url as profileImageUrl',
                'JSON_ARRAYAGG(optionalSubjects.subjectId) as optionalSubjectIds',
            ])
            .groupBy('student.id')
            .addGroupBy('classRoom.id')
            .addGroupBy('enrollment.rollNo')
            .getRawOne();

        if (!student) throw new NotFoundException('Student not found');

        const studentOptionalSubjectIds = (typeof student.optionalSubjectIds === 'string' ? JSON.parse(student.optionalSubjectIds) : student.optionalSubjectIds).filter(Boolean);

        const querybuilder = this.getRepository(Exam).createQueryBuilder('exam')
            .where("exam.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin("exam.examType", "examType")
            .leftJoin("exam.classRoom", "classRoom")
            .andWhere("exam.examTypeId = :examTypeId", { examTypeId: examTypeId })
            .andWhere("classRoom.id = :classRoomId", { classRoomId: student.parentClassId ?? student.classRoomId })
            .leftJoin('exam.examSubjects', 'examSubjects')
            .leftJoin('examSubjects.subject', 'subject')
            .andWhere(new Brackets(qb => {
                studentOptionalSubjectIds?.length && (
                    qb.andWhere("CASE WHEN subject.type = :optional THEN subject.id IN (:...optionalSubjectIds) ELSE 1 = 1 END", { optional: ESubjectType.OPTIONAL, optionalSubjectIds: studentOptionalSubjectIds })
                )
            }))
            .leftJoin('examSubjects.examReports', 'examReports', 'examReports.studentId = :studentId', { studentId: student.id })
            .select([
                "exam.id",
                "examType.id",
                "examType.name",
                "examSubjects.id",
                "examSubjects.fullMark",
                "examSubjects.passMark",
                "subject.id",
                "subject.subjectName",
                "subject.subjectCode",
                "subject.type",
                "examReports.id",
                "examReports.obtainedMarks",
                "examReports.percentage",
                "examReports.gpa",
                "examReports.grade",
            ]);

        const exam = await querybuilder.getOne();

        if (!exam) throw new NotFoundException('Exam not found');

        // sum the obtained marks of all exam subjects and evaluate corresponding percentage, grade and gpa
        let totalObtainedMarks = 0;
        let fullMarks = 0;


        exam.examSubjects?.forEach(examSubject => {
            fullMarks += examSubject.fullMark;
            totalObtainedMarks += examSubject.examReports[0] ? examSubject.examReports[0].obtainedMarks : 0;
        });

        const percentage = +((totalObtainedMarks / fullMarks) * 100).toFixed(2);

        const { gpa, grade } = await this.examReportsService.getGpaAndGrade(percentage);

        const failedSubjectsCount = exam.examSubjects?.filter(examSubject => examSubject.examReports[0]?.obtainedMarks < examSubject.passMark).length;

        const weakestSubject = exam.examSubjects?.sort((a, b) => a.examReports[0]?.percentage - b.examReports[0]?.percentage)[0]?.subject?.subjectName;

        return {
            student,
            examReport: exam,
            percentage,
            gpa,
            grade,
            failedSubjectsCount,
            weakestSubject
        }
    }
}