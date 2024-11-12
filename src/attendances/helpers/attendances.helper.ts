import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Attendance } from "../entities/attendance.entity";
import { AttendanceCountQueryDto } from "../dto/attendance-count-query.dto";
import { AuthUser, EAttendanceStatus, Role } from "src/common/types/global.type";
import { Injectable } from "@nestjs/common";
import { countDaysInMonth, countDaysInYear } from "src/utils/countDaysInMonth";

@Injectable()
export class AttendancesHelper {
    constructor(
        @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    ) { }

    async getCount(queryDto: AttendanceCountQueryDto, currentUser: AuthUser) {
        const monthlyQuery = this.attendanceRepo.createQueryBuilder('attendance')
            .leftJoin('attendance.account', 'account')
            .select('attendance.status', 'status')
            .addSelect('COUNT(attendance.id)', 'attendanceCount')
            .where(new Brackets(qb => {
                queryDto.month && qb.andWhere('MONTH(attendance.date) = :month', { month: queryDto.month });
                queryDto.year && qb.andWhere('YEAR(attendance.date) = :year', { year: queryDto.year });

                if (currentUser.role === Role.ADMIN) { // admin access
                    queryDto.accountId && qb.andWhere('account.id = :accountId', { accountId: queryDto.accountId });
                } else { // other user can access their attendances only
                    qb.andWhere('account.id = :accountId', { accountId: currentUser.accountId });
                }
            }))
            .groupBy('attendance.status');

        const yearlyQuery = this.attendanceRepo.createQueryBuilder('attendance')
            .leftJoin('attendance.account', 'account')
            .select('attendance.status', 'status')
            .addSelect('COUNT(attendance.id)', 'attendanceCount')
            .where(new Brackets(qb => {
                queryDto.year && qb.andWhere('YEAR(attendance.date) = :year', { year: queryDto.year });

                if (currentUser.role === Role.ADMIN) { // admin access
                    queryDto.accountId && qb.andWhere('account.id = :accountId', { accountId: queryDto.accountId });
                } else { // other user can access their attendances only
                    qb.andWhere('account.id = :accountId', { accountId: currentUser.accountId });
                }
            }))
            .groupBy('attendance.status');

        // Run both queries and format the result into the desired structure
        const [monthlyResult, yearlyResult] = await Promise.all([
            monthlyQuery.getRawMany(),
            yearlyQuery.getRawMany(),
        ]);

        const formatResult = (result: { status: EAttendanceStatus, attendanceCount: string }[]) => {
            return {
                absent: result.find(item => item.status === EAttendanceStatus.ABSENT)?.attendanceCount || 0,
                present: result.find(item => item.status === EAttendanceStatus.PRESENT)?.attendanceCount || 0,
                leave: result.find(item => item.status === EAttendanceStatus.LEAVE)?.attendanceCount || 0,
                late: result.find(item => item.status === EAttendanceStatus.LATE)?.attendanceCount || 0,
            };
        };

        const finalResult = {
            monthly: {
                ...formatResult(monthlyResult),
                total: countDaysInMonth(queryDto.year, queryDto.month),
                month: queryDto.month,
            },
            yearly: {
                ...formatResult(yearlyResult),
                year: queryDto.year,
                total: countDaysInYear(queryDto.year),
            },
        };

        return finalResult;
    }
}