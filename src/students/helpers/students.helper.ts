import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Brackets, Not, Repository } from "typeorm";
import { Student } from "../entities/student.entity";
import { StudentQueryDto, StudentSortBy } from "../dto/student-query.dto";
import { CreateStudentDto } from "../dto/create-student.dto";
import { UpdateStudentDto } from "../dto/update-student.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentAttendanceQueryDto } from "../dto/student-attendance-query.dto";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CACHE_KEYS } from "src/common/CONSTANTS";

@Injectable()
export class StudentsHelper {
    constructor(
        @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async setQuery(queryDto: StudentQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

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
            .where("enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId }) 
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(qb => {
                        qb.orWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                        qb.orWhere("LOWER(student.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                    }))
                }

                queryDto.studentId && qb.andWhere('student.studentId = :studentId', { studentId: queryDto.studentId });

                queryDto.classRoomId && qb.andWhere(new Brackets(qb => { // if class room id, check in both section and class
                    qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                    qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                }))

                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // the sectionId send by the frontend is the class room id
            }))
            .select([
                "student.id as id",
                "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
                "enrollments.rollNo as rollNo",
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
            ])

        const count = await queryBuilder.getCount();
        const data = await queryBuilder.getRawMany();

        const pageMetaDto = new PageMetaDto({ itemCount: count, pageOptionsDto: queryDto });

        return new PageDto(data, pageMetaDto);
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
        const { rollNo, email, phone, bankAccountNumber, nationalIdCardNo } = studentDto;

        const existingStudent = await this.studentRepo.createQueryBuilder('student')
            .where(new Brackets(qb => {
                qb.where([
                    { email },
                    { phone },
                    { rollNo },
                    { bankAccountNumber }
                ])
                student?.id && qb.andWhere({ id: Not(student.id) })
            })).getOne();

        if (existingStudent && !student) {
            if (existingStudent.email === email) throw new BadRequestException('Student with this email already exists');
            if (existingStudent.nationalIdCardNo === nationalIdCardNo) throw new BadRequestException('Student with this nationalIdCardNo already exists');
            // if (existingStudent.phone === phone) throw new BadRequestException('Student with this phone already exists');
            // if (existingStudent.rollNo === rollNo) throw new BadRequestException('Student with this rollNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber) throw new BadRequestException('Student with this bankAccountNumber already exists');
        } else if (existingStudent && student) {
            if (existingStudent.email === email && existingStudent.id !== student.id) throw new BadRequestException('Student with this email already exists');
            if (existingStudent.nationalIdCardNo === nationalIdCardNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this nationalIdCardNo already exists');
            // if (existingStudent.phone === phone && existingStudent.id !== student.id) throw new BadRequestException('Student with this phone already exists');
            // if (existingStudent.rollNo === rollNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this rollNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber && existingStudent.id !== student.id) throw new BadRequestException('Student with this bankAccountNumber already exists');
        }
    }

    async getStudentsWithAttendance(queryDto: StudentAttendanceQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const studentsWithAttendance = await this.studentRepo.createQueryBuilder('student')
            .where("FIND_IN_SET(:academicYearId, student.academicYearIds) > 0", { academicYearId: currentAcademicYearId })
            .leftJoin("student.account", "account")
            .leftJoin("student.classRoom", "classRoom")
            .leftJoinAndMapOne(
                "student.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = :attendanceDate",
                { attendanceDate: new Date(queryDto.date).toISOString().split('T')[0] }
            )
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
}