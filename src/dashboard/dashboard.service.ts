import { Inject, Injectable, Scope } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { Student } from 'src/students/entities/student.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { LeaveRequest } from 'src/leave-requests/entities/leave-request.entity';
import { EClassType, ELeaveRequestStatus, Role } from 'src/common/types/global.type';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable({ scope: Scope.REQUEST })
export class DashboardService extends BaseRepository {
    constructor(
        datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) { super(datasource, req); }

    async getAdminDashboardCounts() {
        const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();

        const studentsCountQueryBuilder = this.getRepository(Student).createQueryBuilder('student')
            .leftJoin('student.account', 'account')
            .innerJoin('student.enrollments', 'enrollments', 'enrollments.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
        this.utilitiesService.applyBranchFilter(studentsCountQueryBuilder);

        const teachersCountQueryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher')
            .leftJoin('teacher.account', 'account')
        this.utilitiesService.applyBranchFilter(teachersCountQueryBuilder);

        const staffsCountQueryBuilder = this.getRepository(Staff).createQueryBuilder('staff')
            .leftJoin('staff.account', 'account')
        this.utilitiesService.applyBranchFilter(staffsCountQueryBuilder);

        const classRoomsCountQueryBuilder = this.getRepository(ClassRoom).createQueryBuilder('classRoom')
            .leftJoin('classRoom.children', 'children')
            .select([
                'COUNT(DISTINCT CASE WHEN classRoom.classType = :primary THEN children.id END) as sectionsCount',
                'COUNT(DISTINCT CASE WHEN classRoom.classType = :primary AND children.id IS NULL THEN classRoom.id END) as primaryWithNoSectionsCount',
            ])
            .setParameter('primary', EClassType.PRIMARY)
        this.utilitiesService.applyBranchFilter(classRoomsCountQueryBuilder, "classRoom.branchId = :branchId");

        const [studentsCount, teachersCount, staffsCount, classRoomsCount] = await Promise.all([
            studentsCountQueryBuilder.getCount(),
            teachersCountQueryBuilder.getCount(),
            staffsCountQueryBuilder.getCount(),
            classRoomsCountQueryBuilder.getRawOne(),
        ])

        return {
            studentsCount,
            teachersCount,
            staffsCount,
            classRoomsCount: +classRoomsCount.sectionsCount + +classRoomsCount.primaryWithNoSectionsCount,
        }
    }

    async getLeaveRequests() {
        const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();

        const studentsLeaveRequestsQueryBuilder = this.getRepository(LeaveRequest).createQueryBuilder('leaveRequest')
            .orderBy('leaveRequest.createdAt', 'DESC')
            .leftJoin('leaveRequest.account', 'account')
            .leftJoin('account.student', 'student')
            .leftJoin('student.enrollments', 'enrollments', 'enrollments.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.profileImage', 'profileImage')
            .where('account.role = :role', { role: Role.STUDENT })
            .andWhere('leaveRequest.status = :status', { status: ELeaveRequestStatus.PENDING })
            .andWhere('enrollments.id IS NOT NULL')
        this.utilitiesService.applyBranchFilter(studentsLeaveRequestsQueryBuilder);

        const studentsLeaveRequests = await studentsLeaveRequestsQueryBuilder.clone()
            .limit(3)
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
            .limit(3)
            .leftJoin('leaveRequest.account', 'account')
            .leftJoin('account.teacher', 'teacher')
            .leftJoin('teacher.profileImage', 'profileImage')
            .where('account.role = :role', { role: Role.TEACHER })
            .andWhere('leaveRequest.status = :status', { status: ELeaveRequestStatus.PENDING })

        const teachersLeaveRequests = await teachersLeaveRequestsQueryBuilder.clone()
            .limit(3)
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

