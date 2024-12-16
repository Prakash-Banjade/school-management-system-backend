import { Injectable } from "@nestjs/common";
import { Attendance } from "./entities/attendance.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EAttendanceStatus } from "src/common/types/global.type";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { format, sub } from "date-fns";

@Injectable()
export class AttendanceCron {
    constructor(
        @InjectRepository(Attendance) private readonly attendanceRepo: Repository<Attendance>,
        @InjectRepository(Teacher) private readonly teachersRepo: Repository<Teacher>,
        @InjectRepository(Staff) private readonly staffsRepo: Repository<Staff>,
    ) { }

    /**
     * For employees, if the attendance of the day is not recorded, mark it as absent
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    @Cron("*/5 * * * * *")
    async markAttendanceAsAbsent() {
        console.log('Marking attendance as absent...');

        const teachersWithNoAttendance = await this.teachersRepo.createQueryBuilder('teacher')
            .leftJoin('teacher.account', 'account')
            .leftJoin('account.attendances', 'attendances', 'DATE(attendances.date) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)')
            .where('attendances.id IS NULL')
            .select(['teacher.id', 'account.id']).getMany();

        const staffsWithNoAttendance = await this.staffsRepo.createQueryBuilder('staff')
            .leftJoin('staff.account', 'account')
            .leftJoin('account.attendances', 'attendances', 'DATE(attendances.date) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)')
            .where('attendances.id IS NULL')
            .select(['staff.id', 'account.id']).getMany();

        const attendances: Attendance[] = [];

        for (const employee of [...teachersWithNoAttendance, ...staffsWithNoAttendance]) {
            const attendance = this.attendanceRepo.create({
                account: employee.account,
                inTime: null,
                outTime: null,
                status: EAttendanceStatus.ABSENT,
                date: format(sub(new Date(), { days: 1 }), 'yyyy-MM-dd'),
            });
            attendances.push(attendance);
        }

        if (attendances.length > 0) {
            await this.attendanceRepo.save(attendances);
        }
    }
}