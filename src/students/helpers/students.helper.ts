import { BadRequestException, Injectable } from "@nestjs/common";
import { Brackets, Not, Repository, SelectQueryBuilder } from "typeorm";
import { Student } from "../entities/student.entity";
import { StudentQueryDto, StudentSortBy } from "../dto/student-query.dto";
import { CreateStudentDto } from "../dto/create-student.dto";
import { UpdateStudentDto } from "../dto/update-student.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentAttendanceQueryDto } from "../dto/student-attendance-query.dto";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { PageMetaDto } from "src/common/dto/pageMeta.dto";
import { PageDto } from "src/common/dto/page.dto.";

@Injectable()
export class StudentsHelper {
    constructor(
        @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    ) { }

    async setQuery(queryDto: StudentQueryDto) {
        const queryBuilder = this.studentRepo.createQueryBuilder('student')
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .addSelect("CONCAT(student.firstName, ' ', student.lastName) AS fullName")
            .orderBy(this.getOrderByKey(queryDto), queryDto.order)
            .leftJoin('student.classRoom', 'classRoom')
            .leftJoin('student.profileImage', 'profileImage')
            .leftJoin('student.account', 'account')
            .leftJoin('student.enrollments', 'enrollment')
            .leftJoin('enrollment.academicYear', 'academicYear')
            .leftJoin('account.user', 'user')
            .leftJoin('classRoom.parent', 'parent')
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
            .andWhere('academicYear.isActive = :isActive', { isActive: true }) // filter by active academic year
            .select([
                "student.id as id",
                "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
                "student.rollNo as rollNo",
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
                "account.id as accountId",
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
        const studentsWithAttendance = await this.studentRepo.createQueryBuilder('student')
            .leftJoin("student.account", "account")
            .leftJoin("student.classRoom", "classRoom")
            .leftJoin("student.enrollments", "enrollment")
            .leftJoin("enrollment.academicYear", "academicYear")
            .leftJoinAndMapOne(
                "student.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = :attendanceDate",
                { attendanceDate: new Date(queryDto.date).toISOString().split('T')[0] }
            )
            .where("academicYear.isActive = :isActive", { isActive: true })
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