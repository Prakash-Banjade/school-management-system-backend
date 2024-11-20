import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Brackets, Not, Repository } from "typeorm";
import { Student } from "../entities/student.entity";
import { PastStudentsQueryDto, StudentAttendanceQueryDto, StudentQueryDto, StudentSortBy } from "../dto/student-query.dto";
import { CreateStudentDto } from "../dto/create-student.dto";
import { UpdateStudentDto } from "../dto/update-student.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CACHE_KEYS } from "src/common/CONSTANTS";
import { paginatedRawData } from "src/utils/paginatedData";

@Injectable()
export class StudentsHelper {
    constructor(
        @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async findAll(queryDto: StudentQueryDto) {
        const academicYearId = queryDto.academicYearId || await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const queryBuilder = this.studentRepo.createQueryBuilder('student')
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .addSelect("CONCAT(student.firstName, ' ', student.lastName) AS fullName")
            .orderBy(this.getOrderByKey(queryDto), queryDto.order)
            .leftJoin('student.routeStop', 'routeStop')
            .leftJoin('student.enrollments', 'enrollments')
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.profileImage', 'profileImage')
            .where("enrollments.academicYearId = :academicYearId", { academicYearId: academicYearId })
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(subQb => {
                        subQb.orWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("LOWER(student.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("TRIM(student.studentId) = TRIM(:exactSearch)", { exactSearch: queryDto.search })
                    }))
                }
                queryDto.studentId && qb.andWhere('student.studentId = :studentId', { studentId: queryDto.studentId });

                queryDto.classRoomId && qb.andWhere(new Brackets(qb => { // if class room id, check in both section and class
                    qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                    qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                }))

                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // the sectionId send by the frontend is the class room id
            }))
            .select(this.getStudentsSelectCols(queryDto.onlyBasicInfo));

        return paginatedRawData(queryDto, queryBuilder);
    }

    private getStudentsSelectCols(onlyBasicInfo: boolean) {
        const basicCols = [
            "student.id as id",
            "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
            "enrollments.rollNo as rollNo",
            "student.studentId as studentId",
            "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
        ];

        return onlyBasicInfo
            ? basicCols
            : [
                ...basicCols,
                "student.phone as phone",
                "student.email as email",
                "student.dob as dob",
                "student.studentId as studentId",
                "student.gender as gender",
                "profileImage.url as profileImageUrl",
                "classRoom.id as classRoomId",
                "classRoom.name as classRoom",
                "parent.id as parentClassId",
                "parent.name as parentClass",
                "routeStop.id as routeStopId",
                "routeStop.name as routeStop",
            ]
    }

    private getOrderByKey(queryDto: StudentQueryDto) {
        switch (queryDto.sortBy) {
            case StudentSortBy.NAME: {
                return 'fullName';
            }
            case StudentSortBy.ROLL_NO: {
                return 'student.rollNo';
            }
            case StudentSortBy.STUDENT_ID: {
                return 'student.studentId';
            }
            case StudentSortBy.GENDER: {
                return 'student.gender';
            }
            case StudentSortBy.DOB: {
                return 'student.dob';
            }
            default: {
                return 'student.createdAt';
            }
        }
    }

    async checkIfStudentExists(studentDto: CreateStudentDto | UpdateStudentDto, student?: Student) {
        const { rollNo, email, bankAccountNumber, nationalIdCardNo } = studentDto;

        const existingStudent = await this.studentRepo.createQueryBuilder('student')
            .where(new Brackets(qb => {
                qb.where([
                    { email },
                    { rollNo },
                    { bankAccountNumber }
                ])
                student?.id && qb.andWhere({ id: Not(student.id) })
            })).getOne();

        if (existingStudent && !student) {
            if (existingStudent.email === email) throw new BadRequestException('Student with this email already exists');
            if (existingStudent.nationalIdCardNo === nationalIdCardNo) throw new BadRequestException('Student with this nationalIdCardNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber) throw new BadRequestException('Student with this bankAccountNumber already exists');
        } else if (existingStudent && student) {
            if (existingStudent.email === email && existingStudent.id !== student.id) throw new BadRequestException('Student with this email already exists');
            if (existingStudent.nationalIdCardNo === nationalIdCardNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this nationalIdCardNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber && existingStudent.id !== student.id) throw new BadRequestException('Student with this bankAccountNumber already exists');
        }
    }

    async getStudentsWithAttendance(queryDto: StudentAttendanceQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const studentsWithAttendance = await this.studentRepo.createQueryBuilder('student')
            .leftJoin("student.enrollments", "enrollments")
            .leftJoin("student.account", "account")
            .leftJoin("enrollments.classRoom", "classRoom")
            .leftJoinAndMapOne(
                "student.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = :attendanceDate",
                { attendanceDate: new Date(queryDto.date).toISOString().split('T')[0] }
            )
            .where("enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .andWhere(new Brackets((qb) => {
                if (!queryDto.sectionId) {
                    qb.where("classRoom.id = :classroomId", { classroomId: queryDto.classRoomId }); // if section id is not present look for class room id
                } else {
                    qb.andWhere("classRoom.id = :sectionId", { sectionId: queryDto.sectionId }); // if section id is present look for section id
                }
            }))
            .select([
                "student.id",
                "student.firstName",
                "student.lastName",
                "student.rollNo",
                "account.id",
                "attendance.id",
                "attendance.status",
                "attendance.date"
            ])
            .getMany();

        return studentsWithAttendance;

    }

    async getPastStudents(queryDto: PastStudentsQueryDto) {
        const queryBuilder = this.studentRepo.createQueryBuilder('student')
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .orderBy('student.rollNo', 'ASC')
            .leftJoin('student.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin(
                // Subquery to get the latest enrollment using ROW_NUMBER
                qb => qb
                    .select('enrollment.studentId', 'studentId')
                    .addSelect('enrollment.id', 'id')
                    .addSelect('enrollment.academicYearId', 'academicYearId')
                    .addSelect('ROW_NUMBER() OVER (PARTITION BY enrollment.studentId ORDER BY enrollment.createdAt DESC) AS rowNumber')
                    .from('enrollment', 'enrollment'),
                'latestEnrollment',
                'latestEnrollment.studentId = student.id AND latestEnrollment.rowNumber = 1' // Filter to only include the latest enrollment
            )
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(subQb => {
                        subQb.orWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("LOWER(student.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("TRIM(student.studentId) = TRIM(:exactSearch)", { exactSearch: queryDto.search });
                    }));
                }

                queryDto.studentId && qb.andWhere('student.studentId = :studentId', { studentId: queryDto.studentId });

                queryDto.classRoomId && qb.andWhere('parent.id = :classRoomId OR classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });

                // Add filter for academicYearId
                queryDto.academicYearId && qb.andWhere('latestEnrollment.academicYearId = :academicYearId', { academicYearId: queryDto.academicYearId });
            }))
            .select([
                "student.id AS id",
                "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
                "student.rollNo AS rollNo",
                "student.studentId AS studentId",
                "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
                "latestEnrollment.id AS enrollmentId",
            ]);



        return paginatedRawData(queryDto, queryBuilder);
    }

    async getFeeStudent(studentId: string) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const student = await this.studentRepo.createQueryBuilder('student')
            .leftJoin("student.enrollments", "enrollments", "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin("classRoom.parent", "parent")
            .leftJoin("student.profileImage", "profileImage")
            .where("student.studentId = :studentId", { studentId })
            .select([
                "student.id AS id",
                "CONCAT(student.firstName, ' ', student.lastName) AS name",
                "student.rollNo AS rollNo",
                "student.phone AS phone",
                "student.email AS email",
                "profileImage.url AS profileImageUrl",
                "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
            ])
            .groupBy('student.id')
            .addGroupBy('classRoom.id')
            .getRawOne();

        if (!student || !student.classRoomName) throw new NotFoundException('Student not found');

        return student;
    }
}