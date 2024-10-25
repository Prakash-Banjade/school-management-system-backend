import { BadRequestException, Injectable } from "@nestjs/common";
import { Brackets, Not, Repository, SelectQueryBuilder } from "typeorm";
import { Student } from "../entities/student.entity";
import { StudentQueryDto, StudentSortBy } from "../dto/student-query.dto";
import { CreateStudentDto } from "../dto/create-student.dto";
import { UpdateStudentDto } from "../dto/update-student.dto";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class StudentsHelper {
    constructor(
        @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    ) { }

    setQuery(queryBuilder: SelectQueryBuilder<Student>, queryDto: StudentQueryDto) {
        queryBuilder
            .skip(queryDto.skip)
            .take(queryDto.take)
            .withDeleted()
            .leftJoin('student.classRoom', 'classRoom')
            .leftJoin('student.profileImage', 'profileImage')
            .leftJoin('student.account', 'account')
            .leftJoin('student.enrollments', 'enrollment')
            .leftJoin('enrollment.academicYear', 'academicYear')
            .leftJoin('account.user', 'user')
            .leftJoin('classRoom.parent', 'parent')
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    const search = `%${queryDto.search.toLowerCase()}%`;
                    const phoneSearch = `${queryDto.search}%`; // only match from beginning

                    qb.orWhere("LOWER(CONCAT(COALESCE(student.firstName, ''), ' ', COALESCE(student.lastName, ''))) LIKE :search", { search })
                        .orWhere("LOWER(student.email) LIKE :search", { search })
                        .orWhere("student.phone LIKE :phoneSearch", { phoneSearch })
                        .orWhere("student.rollNo = :exactSearch", { exactSearch: queryDto.search });
                }

                queryDto.classRoomId && qb.andWhere(new Brackets(qb => {
                    qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                    qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                }))

                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // the sectionId send by the frontend is the class room id
            }))
            .andWhere('academicYear.isActive = :isActive', { isActive: true }) // filter by active academic year
            .orderBy(this.getOrderByKey(queryDto), queryDto.order)
    }

    private getOrderByKey(queryDto: StudentQueryDto) {
        switch (queryDto.sortBy) {
            case StudentSortBy.NAME: {
                return 'CONCAT(student.firstName, " ", student.lastName)'; // TODO: not sorted by name
            }
            case StudentSortBy.ROLL_NO: {
                return 'student.rollNo';
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
            if (existingStudent.phone === phone) throw new BadRequestException('Student with this phone already exists');
            if (existingStudent.rollNo === rollNo) throw new BadRequestException('Student with this rollNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber) throw new BadRequestException('Student with this bankAccountNumber already exists');
        } else if (existingStudent && student) {
            if (existingStudent.email === email && existingStudent.id !== student.id) throw new BadRequestException('Student with this email already exists');
            if (existingStudent.nationalIdCardNo === nationalIdCardNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this nationalIdCardNo already exists');
            if (existingStudent.phone === phone && existingStudent.id !== student.id) throw new BadRequestException('Student with this phone already exists');
            if (existingStudent.rollNo === rollNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this rollNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber && existingStudent.id !== student.id) throw new BadRequestException('Student with this bankAccountNumber already exists');
        }
    }
}