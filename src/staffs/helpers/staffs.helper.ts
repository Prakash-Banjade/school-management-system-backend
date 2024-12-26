import { InjectRepository } from "@nestjs/typeorm";
import { Staff } from "../entities/staff.entity";
import { Repository } from "typeorm";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { EmployeeAttendanceQueryDto } from "src/teachers/dto/employee-attendance-query.dto";
import { UtilitiesService } from "src/utilities/utilities.service";

export class StaffsHelper {
    constructor(
        @InjectRepository(Staff) private readonly staffRepo: Repository<Staff>,
        private readonly utilitiesService: UtilitiesService,
    ) { }

    async getStaffsWithAttendance(queryDto: EmployeeAttendanceQueryDto) {
        const queryBuilder = this.staffRepo.createQueryBuilder('staff')
            .leftJoin("staff.account", "account")
            .leftJoinAndMapOne(
                "staff.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = DATE(:attendanceDate)",
                { attendanceDate: queryDto.date }
            )
            .select([
                "staff.id",
                "staff.staffId",
                "staff.firstName",
                "staff.lastName",
                "staff.type",
                "account.id",
                "attendance.id",
                "attendance.status",
                "attendance.date",
                "attendance.inTime",
                "attendance.outTime",
            ])

        const staffsWithAttendance = await this.utilitiesService.applyBranchFilter(queryBuilder).getMany();

        return staffsWithAttendance;

    }
}