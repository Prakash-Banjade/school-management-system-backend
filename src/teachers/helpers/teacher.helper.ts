import { InjectRepository } from "@nestjs/typeorm";
import { Teacher } from "../entities/teacher.entity";
import { Brackets, Repository } from "typeorm";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { EmployeeAttendanceQueryDto } from "../dto/employee-attendance-query.dto";
import { QueryDto } from "src/common/dto/query.dto";

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

    async getTeacherOptions(queryDto: QueryDto) {
        const teacherOptions = await this.teacherRepo.createQueryBuilder('teacher')
            .orderBy("teacher.createdAt", queryDto.order)
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .where(new Brackets(qb => {
                if (!!queryDto.search) {
                    qb.where("LOWER(CONCAT(teacher.firstName, ' ', teacher.lastName)) LIKE LOWER(:search)", {
                        search: `%${queryDto.search}%`
                    });
                }
            }))
            .select([
                "teacher.id as value",
                "CONCAT(teacher.firstName, ' ', teacher.lastName) as label"
            ])
            .getRawMany();

        return teacherOptions;
    }
}