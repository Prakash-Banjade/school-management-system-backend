import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { AuthMessage, WEAK_PERCENTAGE_THRESHOLD } from "src/common/CONSTANTS";
import { BaseRepository } from "src/common/repository/base-repository";
import { Student } from "src/students/entities/student.entity";
import { Brackets, DataSource, QueryBuilder } from "typeorm";
import { Exam } from "../entities/exam.entity";
import { ExamReportsService } from "src/examination-system/exam-reports/exam-reports.service";
import { ExamStudentsQueryDto } from "../dto/exam-query.dto";
import { AuthUser, ESubjectType } from "src/common/types/global.type";
import { UtilitiesService } from "src/utilities/utilities.service";
import { isStudent } from "src/utils/utils";
import { AcademicYearsService } from "src/academic-years/academic-years.service";

@Injectable()
export class ExamsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly examReportsService: ExamReportsService,
        private readonly utilitiesService: UtilitiesService,
        private readonly academicYearService: AcademicYearsService,
    ) { super(dataSource, req) }

    async getExamStudents(examId: string, queryDto: ExamStudentsQueryDto) {
        const exam = await this.getRepository<Exam>(Exam).findOne({
            where: { id: examId },
            relations: ['classRoom'],
            select: { id: true, classRoom: { id: true } }
        });

        if (!exam) throw new BadRequestException('Exam not found');

        const querybuilder = this.getRepository<Student>(Student).createQueryBuilder('student')
            .innerJoin('student.enrollments', 'enrollments', "enrollments.academicYearId = :academicYearId", { academicYearId: await this.utilitiesService.getAcademicYearId() })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.optionalSubjects', 'optionalSubjects', 'optionalSubjects.classRoomId = :classRoomId', { classRoomId: exam.classRoom.id })
            .andWhere('CASE WHEN parent.id IS NULL THEN classRoom.id ELSE parent.id END = :classRoomId', { classRoomId: exam.classRoom.id })
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

    async getExamReportByStudent(studentId: string, examTypeId: string, currentUser: AuthUser) {
        if (!studentId) throw new BadRequestException('Student id is required');

        const academicYearId = await this.utilitiesService.getAcademicYearId();

        const student = await this.getRepository(Student).createQueryBuilder('student')
            .where("student.studentId = :studentId OR student.id = :studentId", { studentId }) // the second condition of is due to when student request this api, we check of student.id from the currentUser
            .innerJoin('student.enrollments', 'enrollment', "enrollment.academicYearId = :academicYearId", { academicYearId })
            .leftJoin('enrollment.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.account', 'account')
            .leftJoin('account.profileImage', 'profileImage')
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

        const examQueryBuilder = this.getRepository(Exam).createQueryBuilder('exam')
            .leftJoin("exam.examType", "examType")
            .leftJoin("exam.classRoom", "classRoom")
            .leftJoin('exam.examSubjects', 'examSubjects')
            .leftJoin('examSubjects.subject', 'subject')
            .where("exam.academicYearId = :academicYearId", { academicYearId })
            .andWhere("exam.examTypeId = :examTypeId", { examTypeId })
            .andWhere("classRoom.id = :classRoomId", { classRoomId: student.parentClassId ?? student.classRoomId })
            .andWhere(new Brackets(qb => {
                studentOptionalSubjectIds?.length && (
                    qb.andWhere("CASE WHEN subject.type = :optional THEN subject.id IN (:...optionalSubjectIds) ELSE 1 = 1 END", { optional: ESubjectType.OPTIONAL, optionalSubjectIds: studentOptionalSubjectIds })
                )
            }))
            .innerJoin('examSubjects.examReports', 'examReports', 'examReports.studentId = :studentId', { studentId: student.id })
            .select([
                "exam.id",
                "exam.isReportPublished",
                "examType.id",
                "examType.name",
                "examSubjects.id",
                "examSubjects.theoryFM",
                "examSubjects.theoryPM",
                "examSubjects.practicalFM",
                "examSubjects.practicalPM",
                "subject.id",
                "subject.subjectName",
                "subject.subjectCode",
                "subject.type",
                "examReports.id",
                "examReports.theoryOM",
                "examReports.practicalOM",
                "examReports.percentage",
                "examReports.gpa",
                "examReports.grade",
            ]);

        this.utilitiesService.applyBranchFilter(examQueryBuilder, 'classRoom.branchId = :branchId');

        const exam = await examQueryBuilder.getOne();

        if (!exam) throw new NotFoundException('Exam not found');

        if (isStudent(currentUser) && !exam.isReportPublished) throw new NotFoundException(AuthMessage.REPORT_NOT_PUBLISHED);

        // sum the obtained marks of all exam subjects and evaluate corresponding percentage, grade and gpa
        let totalObtainedMarks = 0;
        let fullMarks = 0;

        exam.examSubjects?.forEach(examSubject => {
            fullMarks += examSubject.theoryFM + examSubject.practicalFM;
            totalObtainedMarks += examSubject.examReports[0]
                ? (examSubject.examReports[0].theoryOM + examSubject.examReports[0].practicalOM)
                : 0;
        });

        const percentage = +((totalObtainedMarks / fullMarks) * 100).toFixed(2);

        const { gpa, grade } = await this.examReportsService.getGpaAndGrade(percentage);

        const failedSubjectsCount = exam.examSubjects?.filter(examSubject => (
            (examSubject.examReports[0]?.theoryOM < examSubject.theoryPM) || (examSubject.examReports[0]?.practicalOM < examSubject.practicalPM)
        )).length;

        const weakSubjects = exam.examSubjects?.filter(es => es.examReports[0]?.percentage < WEAK_PERCENTAGE_THRESHOLD).map(es => es.subject.subjectName);

        return {
            student,
            examReport: exam,
            percentage,
            gpa,
            grade,
            failedSubjectsCount,
            weakSubjects
        }
    }

    async getUpcommingExam(currentUser: AuthUser) { // used in student dashboard
        if (!isStudent(currentUser)) throw new ForbiddenException();

        const academicYearId = await this.academicYearService.getCurrentAcademicYearId();

        const querybuilder = this.getRepository(Exam).createQueryBuilder('exam')
            .where("exam.academicYearId = :academicYearId", { academicYearId })
            .andWhere("exam.classRoomId = :classRoomId", { classRoomId: currentUser.parentClassId ?? currentUser.classRoomId }) // exam is associated with primary class, so check with parentClassId first
            .andWhere("DATE(exam.startingFrom) >= DATE(:startingFrom)", { startingFrom: new Date() })
            .leftJoin("exam.examType", "examType")
            .leftJoin("exam.examSubjects", "examSubjects")
            .leftJoin("examSubjects.subject", "subject")
            .select([
                "exam.id",
                "examType.id",
                "examType.name",
                "examSubjects.id",
                "examSubjects.examDate",
                "subject.id",
                "subject.subjectName",
                "examSubjects.venue",
                "examSubjects.startTime",
            ])
            .cache(true);

        return querybuilder.getOne();
    }
}