import { InjectRepository } from "@nestjs/typeorm";
import { Teacher } from "../entities/teacher.entity";
import { Repository } from "typeorm";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { EmployeeAttendanceQueryDto } from "../dto/employee-attendance-query.dto";

export class TeachersHelper {
    constructor(
        @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
    ) { }

    async getTeachersWithAttendance(queryDto: EmployeeAttendanceQueryDto) {
        const teachersWithAttendance = await this.teacherRepo.createQueryBuilder('teacher')
            .leftJoin("teacher.account", "account")
            .leftJoinAndMapOne(
                "teacher.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = :attendanceDate",
                { attendanceDate: new Date(queryDto.date).toISOString().split('T')[0] }
            )
            .select([
                "teacher.id",
                "teacher.teacherId",
                "teacher.firstName",
                "teacher.lastName",
                "account.id",
                "attendance.id",
                "attendance.status",
                "attendance.date"
            ])
            .getMany();

        return teachersWithAttendance;

    }
}