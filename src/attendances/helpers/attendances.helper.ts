import { Brackets, DataSource } from "typeorm";
import { Attendance } from "../entities/attendance.entity";
import { AttendanceCountQueryDto } from "../dto/attendance-count-query.dto";
import { AuthUser, EAttendanceStatus, Role } from "src/common/types/global.type";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { countDaysInMonth, countDaysInYear } from "src/utils/countDaysInMonth";
import { BaseRepository } from "src/common/repository/base-repository";
import { FastifyRequest } from "fastify";
import { REQUEST } from "@nestjs/core";
import { CreateLeaveAttendanceEvent } from "../dto/create-attendance.dto";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import { OnEvent } from "@nestjs/event-emitter";

export const enum AttendanceEvent {
    CREATE_LEAVE = "attendance:create_leave"
}

@Injectable()
export class AttendancesHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly appDataSource: DataSource,
    ) { super(dataSource, req) }

    async getCount(queryDto: AttendanceCountQueryDto, currentUser: AuthUser) {
        const monthlyQuery = this.getRepository(Attendance).createQueryBuilder('attendance')
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

        const yearlyQuery = this.getRepository(Attendance).createQueryBuilder('attendance')
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

    private async getAccount(accountId: string) {
        const account = await this.getRepository(Account).findOne({
            where: { id: accountId },
            select: { id: true }
        });
        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    @OnEvent(AttendanceEvent.CREATE_LEAVE)
    async createLeaveAttendance(dto: CreateLeaveAttendanceEvent) {
        const queryRunner = this.appDataSource.createQueryRunner();

        await queryRunner.connect();

        await queryRunner.startTransaction();

        try {
            const account = await this.getAccount(dto.accountId);

            // removing old attendances if happened between these dates
            await this.getRepository(Attendance).createQueryBuilder()
                .delete()
                .from(Attendance)
                .where('accountId = :accountId', { accountId: dto.accountId })
                .andWhere('DATE(date) BETWEEN DATE(:dateFrom) AND DATE(:dateTo)', { dateFrom: dto.dateFrom, dateTo: dto.dateTo })
                .execute();

            const dateFrom = new Date(dto.dateFrom);
            const dateTo = new Date(dto.dateTo);

            let attendances: Attendance[] = [];

            while (dateFrom <= dateTo) {
                const attendance = this.getRepository(Attendance).create({
                    account,
                    date: dateFrom.toISOString(),
                    status: EAttendanceStatus.LEAVE,
                });

                attendances.push(attendance);

                dateFrom.setDate(dateFrom.getDate() + 1);
            }

            this.getRepository(Attendance).save(attendances);

            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }
}