import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Student } from 'src/students/entities/student.entity';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { LeaveRequest } from 'src/leave-requests/entities/leave-request.entity';
import { EClassType, ELeaveRequestStatus, Role } from 'src/common/types/global.type';

@Injectable()
export class DashboardService extends BaseRepository {
    constructor(
        datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(datasource, req); }

    async getAdminDashboardCounts() {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const studentsCount = await this.getRepository(Student).createQueryBuilder('student')
            .leftJoin('student.enrollments', 'enrollments')
            .where('enrollments.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
            .getCount();

        const teachersCount = await this.getRepository(Teacher).createQueryBuilder().getCount();

        const classRoomsCount: {
            sectionsCount: string,
            primaryWithNoSectionsCount: string,
        } = await this.getRepository(ClassRoom).createQueryBuilder('classRoom')
            .leftJoin('classRoom.children', 'children')
            .select([
                'COUNT(DISTINCT CASE WHEN classRoom.classType = :primary THEN children.id END) as sectionsCount',
                'COUNT(DISTINCT CASE WHEN classRoom.classType = :primary AND children.id IS NULL THEN classRoom.id END) as primaryWithNoSectionsCount',
            ])
            .setParameter('primary', EClassType.PRIMARY)
            .getRawOne();

        const staffsCount = await this.getRepository(Staff).createQueryBuilder().getCount();

        return {
            studentsCount,
            teachersCount,
            classRoomsCount: +classRoomsCount.sectionsCount + +classRoomsCount.primaryWithNoSectionsCount,
            staffsCount,
        }
    }

    async getLeaveRequests() {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const studentsLeaveRequestsQueryBuilder = this.getRepository(LeaveRequest).createQueryBuilder('leaveRequest')
            .orderBy('leaveRequest.createdAt', 'DESC')
            .leftJoin('leaveRequest.account', 'account')
            .leftJoin('account.student', 'student')
            .leftJoin('student.enrollments', 'enrollments')
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.profileImage', 'profileImage')
            .where('account.role = :role', { role: Role.STUDENT })
            .andWhere('leaveRequest.status = :status', { status: ELeaveRequestStatus.PENDING })
            .andWhere('enrollments.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })

        const studentsLeaveRequests = await studentsLeaveRequestsQueryBuilder.clone()
            .take(3)
            .select([
                'leaveRequest.id as id',
                'leaveRequest.leaveFrom as leaveFrom',
                'leaveRequest.leaveTo as leaveTo',
                'leaveRequest.title as title',
                'leaveRequest.createdAt as createdAt',
                'CONCAT(student.firstName, " ", student.lastName) as studentName',
                'CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, " (", classRoom.name, ")") END as classRoomName',
                'profileImage.url as profileImageUrl',
            ]).getRawMany();

        const studentsLeaveRequestCount = await studentsLeaveRequestsQueryBuilder.clone().getCount();


        const teachersLeaveRequestsQueryBuilder = this.getRepository(LeaveRequest).createQueryBuilder('leaveRequest')
            .orderBy('leaveRequest.createdAt', 'DESC')
            .take(3)
            .leftJoin('leaveRequest.account', 'account')
            .leftJoin('account.teacher', 'teacher')
            .leftJoin('teacher.profileImage', 'profileImage')
            .where('account.role = :role', { role: Role.TEACHER })
            .andWhere('leaveRequest.status = :status', { status: ELeaveRequestStatus.PENDING })

        const teachersLeaveRequests = await teachersLeaveRequestsQueryBuilder.clone()
            .take(3)
            .select([
                'leaveRequest.id as id',
                'leaveRequest.leaveFrom as leaveFrom',
                'leaveRequest.leaveTo as leaveTo',
                'leaveRequest.title as title',
                'leaveRequest.createdAt as createdAt',
                'CONCAT(teacher.firstName, " ", teacher.lastName) as teacherName',
                'profileImage.url as profileImageUrl',
            ]).getRawMany();

        const teachersLeaveRequestCount = await teachersLeaveRequestsQueryBuilder.clone().getCount();

        return {
            studentsLeaveRequests: {
                total: studentsLeaveRequestCount,
                data: studentsLeaveRequests,
            },
            teachersLeaveRequests: {
                total: teachersLeaveRequestCount,
                data: teachersLeaveRequests,
            },
        }

    }
}

