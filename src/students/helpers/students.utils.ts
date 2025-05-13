import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "../entities/student.entity";
import { Repository } from "typeorm";
import { CreateStudentDto } from "../dto/create-student.dto";
import { AcademicYearsService } from "src/academic-years/academic-years.service";

@Injectable()
export class StudentsUtils {
    constructor(
        @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
        private readonly academicYearService: AcademicYearsService,
    ) { }

    async generateStudentId() {
        const currentYear = new Date().getFullYear();

        const lastStudent = await this.studentRepo
            .createQueryBuilder('student')
            .orderBy('student.createdAt', 'DESC')
            .limit(1)
            .select(['student.id', 'student.studentId'])
            .getOne();

        if (!lastStudent || !lastStudent.studentId) {
            return `STU-${currentYear}-00001`;
        }

        const lastStudentIdParts = lastStudent.studentId?.split('-');
        const lastYear = parseInt(lastStudentIdParts[1], 10);
        const lastCounter = parseInt(lastStudentIdParts[2], 10);

        if (lastYear !== currentYear) {
            return `STU-${currentYear}-00001`; // Reset counter if the year has changed
        }

        const newCounter = (lastCounter + 1).toString().padStart(5, '0');
        return `STU-${currentYear}-${newCounter}`;
    }

    async generateRollNo(dto: CreateStudentDto): Promise<number> {
        const lastStudentInTheClass = await this.studentRepo.findOne({
            where: { classRoom: { id: dto.classRoomId }, enrollments: { academicYear: { id: await this.academicYearService.getCurrentAcademicYearId() } } },
            order: { rollNo: 'DESC' },
            select: { id: true, rollNo: true },
        });

        return lastStudentInTheClass ? lastStudentInTheClass.rollNo + 1 : 1;
    }

    getStudentsSelectCols(onlyBasicInfo: boolean) {
        const basicCols = [
            "student.id as id",
            "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
            "enrollments.rollNo as rollNo",
            "student.studentId as studentId",
            "classRoom.id as classRoomId",
            "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
            "faculty.name as faculty",
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
                "account.id as accountId",
                "faculty.name as faculty",
            ]
    }

}