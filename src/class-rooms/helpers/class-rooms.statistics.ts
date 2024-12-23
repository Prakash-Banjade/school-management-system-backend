import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AttendanceStatisticsQueryDto, ClassRoomAttendancePeriod } from "../dto/attendance-statistics-query.dto";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CACHE_KEYS } from "src/common/CONSTANTS";
import { EAttendanceStatus } from "src/common/types/global.type";
import { BaseRepository } from "src/common/repository/base-repository";
import { FastifyRequest } from "fastify";
import { REQUEST } from "@nestjs/core";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { Student } from "src/students/entities/student.entity";
import { ClassRoom } from "../entities/class-room.entity";

@Injectable()
export class ClassRoomsStatistics extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(dataSource, req); }

    async getAttendanceStatistics(classRoomId: string, queryDto: AttendanceStatisticsQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const attendanceCondition = queryDto.period === ClassRoomAttendancePeriod.THIS_WEEK
            ? "WEEK(attendance.date) = WEEK(CURRENT_DATE()) AND YEAR(attendance.date) = YEAR(CURRENT_DATE())"
            : queryDto.period === ClassRoomAttendancePeriod.THIS_MONTH
                ? "MONTH(attendance.date) = MONTH(CURRENT_DATE()) AND YEAR(attendance.date) = YEAR(CURRENT_DATE())"
                : queryDto.period === ClassRoomAttendancePeriod.PAST_7_DAYS
                    ? "DATE(attendance.date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) AND DATE(attendance.date) <= CURRENT_DATE()"
                    : queryDto.period === ClassRoomAttendancePeriod.PAST_30_DAYS
                        ? "DATE(attendance.date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND DATE(attendance.date) <= CURRENT_DATE()"
                        : null;

        const classRoom = await this.getRepository(ClassRoom).createQueryBuilder('classRoom')
            .where("classRoom.id = :classRoomId", { classRoomId: classRoomId })
            .leftJoin("classRoom.children", "childClass")
            .select(["classRoom.id", "childClass.id"]).getOne();

        if (!classRoom) throw new NotFoundException('Class room not found');

        const classRoomIds = [classRoom.id, ...classRoom.children.map(childClass => childClass.id)];

        const querybuilder = this.getRepository(Attendance).createQueryBuilder('attendance')
            .where(attendanceCondition)
            .leftJoin("attendance.account", "account")
            .leftJoin("account.student", "student", "FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0", { currentAcademicYearId })
            .leftJoin("student.classRoom", "classRoom")
            .andWhere("classRoom.id IN (:...classRoomIds)", { classRoomIds: classRoomIds })
            .select([
                // "DATE_FORMAT(DATE_ADD(attendance.date, INTERVAL 1 DAY), '%Y-%m-%d') AS attendanceDate", // 1 day is added because date changes while retrieving to used a jugad😂
                "DATE_FORMAT(DATE(attendance.date), '%Y-%m-%d') AS attendanceDate",
                `COUNT(DISTINCT CASE WHEN attendance.status = '${EAttendanceStatus.PRESENT}' THEN attendance.id END) AS totalPresentStudentsCount`,
                `COUNT(DISTINCT CASE WHEN attendance.status = '${EAttendanceStatus.ABSENT}' THEN attendance.id END) AS totalAbsentStudentsCount`,
                `COUNT(DISTINCT CASE WHEN attendance.status = '${EAttendanceStatus.LATE}' THEN attendance.id END) AS totalLateStudentsCount`,
                `COUNT(DISTINCT CASE WHEN attendance.status = '${EAttendanceStatus.LEAVE}' THEN attendance.id END) AS totalLeaveStudentsCount`
            ])
            .groupBy("attendance.date")  // Group by the attendance date for daily stats

        const totalStudentsCount = this.getRepository(Student).createQueryBuilder('student')
            .where("FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0", { currentAcademicYearId })
            .andWhere("student.classRoomId IN (:...classRoomIds)", { classRoomIds: classRoomIds })

        const result = await Promise.all([querybuilder.getRawMany(), totalStudentsCount.getCount()]);

        return {
            data: result[0],
            totalStudentsCount: result[1]
        }
    }
}