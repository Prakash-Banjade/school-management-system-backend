import { Teacher } from "../entities/teacher.entity";
import { Brackets, DataSource } from "typeorm";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { EmployeeAttendanceQueryDto } from "../dto/employee-attendance-query.dto";
import { QueryDto } from "src/common/dto/query.dto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BaseRepository } from "src/common/repository/base-repository";
import { FastifyRequest } from "fastify";
import { REQUEST } from "@nestjs/core";
import { ClassRoutine } from "src/class-routines/entities/class-routine.entity";
import { UtilitiesService } from "src/utilities/utilities.service";

@Injectable()
export class TeachersHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) { super(dataSource, req); }

    async getTeachersWithAttendance(queryDto: EmployeeAttendanceQueryDto) {
        const queryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher')
            .leftJoin("teacher.account", "account")
            .leftJoinAndMapOne(
                "teacher.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = DATE(:attendanceDate)",
                { attendanceDate: queryDto.date }
            )
            .select([
                "teacher.id",
                "teacher.teacherId",
                "teacher.firstName",
                "teacher.lastName",
                "account.id",
                "attendance.id",
                "attendance.status",
                "attendance.date",
                "attendance.inTime",
                "attendance.outTime",
            ])

        const teachersWithAttendance = await this.utilitiesService.applyBranchFilter(queryBuilder).getMany();

        return teachersWithAttendance;
    }

    async getTeacherOptions(queryDto: QueryDto) {
        const queryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher')
            .orderBy("teacher.createdAt", queryDto.order)
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .leftJoin("teacher.account", "account")
            .andWhere(new Brackets(qb => {
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

        const teacherOptions = await this.utilitiesService.applyBranchFilter(queryBuilder).getRawMany();

        return teacherOptions;
    }

    async getDetails(id: string) { // used in single teacher page in frontend
        const querybuilder = this.getRepository(Teacher).createQueryBuilder('teacher')
            .leftJoin('teacher.account', 'account')
            .leftJoin('teacher.profileImage', 'profileImage')
            .leftJoin('teacher.assignedClassRooms', 'assignedClassRooms')
            .leftJoin('assignedClassRooms.parent', 'parent')
            .where('teacher.id = :id', { id })
            .select([
                'teacher.id as id',
                'teacher.teacherId as teacherId',
                'CONCAT(teacher.firstName, \' \', teacher.lastName) as fullName',
                'teacher.email as email',
                'teacher.phone as phone',
                'teacher.dob as dob',
                'teacher.gender as gender',
                'teacher.qualification as qualification',
                'teacher.maritalStatus as maritalStatus',
                'teacher.bloodGroup as bloodGroup',
                'teacher.joinedDate as joinedDate',
                'teacher.bankName as bankName',
                'teacher.accountName as accountName',
                'teacher.accountNumber as accountNumber',
                'teacher.shortDescription as shortDescription',
                'account.id as accountId',
                'profileImage.url as profileImageUrl',
                'JSON_ARRAYAGG(CASE WHEN parent.id is NULL THEN assignedClassRooms.name ELSE CONCAT(parent.name, \' - \', assignedClassRooms.name) END) as assignedClassRooms',
            ])

        const teacher = await querybuilder.getRawOne();

        if (!teacher) throw new NotFoundException('Teacher not found');

        return {
            ...teacher,
            assignedClassRooms: typeof teacher.assignedClassRooms === 'string' ? JSON.parse(teacher.assignedClassRooms) : teacher.assignedClassRooms,
        };
    }

    async getClassSchedule(id: string, dayOfTheWeek?: string) { // used in single teacher page in frontend
        const querybuilder = this.getRepository(ClassRoutine).createQueryBuilder('classRoutine')
            .leftJoin('classRoutine.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('classRoutine.subject', 'subject')
            .where('subject.teacherId = :teacherId', { teacherId: id })
            .andWhere(new Brackets(qb => {
                if (dayOfTheWeek) qb.andWhere('classRoutine.dayOfTheWeek = :dayOfTheWeek', { dayOfTheWeek });
            }))
            .orderBy('classRoutine.createdat', 'ASC')
            .select([
                'classRoutine.id as id',
                'classRoutine.dayOfTheWeek as dayOfTheWeek',
                'classRoutine.startTime as startTime',
                'classRoutine.endTime as endTime',
                'CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, \' - \', classRoom.name) END as classRoomName',
                'subject.subjectName as subjectName',
            ]);

        const classSchedule = await querybuilder.getRawMany();

        return classSchedule;
    }

}