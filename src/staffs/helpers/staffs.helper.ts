import { InjectRepository } from "@nestjs/typeorm";
import { Staff } from "../entities/staff.entity";
import { Repository } from "typeorm";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { EmployeeAttendanceQueryDto } from "src/teachers/dto/employee-attendance-query.dto";
import { AuthUser } from "src/common/types/global.type";
import applyBranchFilter from "src/utils/apply-branch-filter";

export class StaffsHelper {
    constructor(
        @InjectRepository(Staff) private readonly staffRepo: Repository<Staff>,
    ) { }

    async getStaffsWithAttendance(queryDto: EmployeeAttendanceQueryDto, currentUser: AuthUser) {
        const queryBuilder = this.staffRepo.createQueryBuilder('staff')
            .leftJoin("staff.account", "account")
            .leftJoinAndMapOne(
                "staff.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = DATE(:attendanceDate)",
                { attendanceDate: new Date(queryDto.date).toISOString().split('T')[0] }
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

        const staffsWithAttendance = await applyBranchFilter(queryBuilder, currentUser.branchId ?? queryDto.branchId).getMany();

        return staffsWithAttendance;

    }
}