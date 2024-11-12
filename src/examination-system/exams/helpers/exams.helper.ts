import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
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
import { ExamReportsService } from "src/examination-system/exam-reports/exam-reports.service";

@Injectable()
export class ExamsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource,
        @Inject(REQUEST) req: FastifyRequest,
        private readonly examReportsService: ExamReportsService,
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
            .leftJoin('student.enrollments', 'enrollments', "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.profileImage', 'profileImage')
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
            ])
            .orderBy('student.rollNo', 'ASC');

        return querybuilder.getRawMany();
    }

    async getExamReportByStudent(studentId: string, examTypeId: string) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const student = await this.getRepository(Student).createQueryBuilder('student')
            .where("student.studentId = :studentId", { studentId })
            .leftJoin('student.enrollments', 'enrollment', "enrollment.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollment.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.profileImage', 'profileImage')
            .select([
                'student.id as id',
                'student.firstName as firstName',
                'student.lastName as lastName',
                'student.phone as phone',
                'student.email as email',
                'student.rollNo as rollNo',
                'classRoom.id as classRoomId',
                'parent.id as parentClassId',
                'classRoom.name as classRoomName',
                'parent.name as parentClassName',
                'profileImage.url as profileImageUrl',
            ]).getRawOne();

        if (!student) throw new NotFoundException('Student not found');

        const querybuilder = this.getRepository(Exam).createQueryBuilder('exam')
            .where("exam.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin("exam.examType", "examType")
            .leftJoin("exam.classRoom", "classRoom")
            .andWhere("exam.examTypeId = :examTypeId", { examTypeId: examTypeId })
            .andWhere("classRoom.id = :classRoomId", { classRoomId: student.parentClassId ?? student.classRoomId })
            .leftJoin('exam.examSubjects', 'examSubjects')
            .leftJoin('examSubjects.subject', 'subject')
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