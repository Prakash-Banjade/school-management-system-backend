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

@Injectable()
export class DashboardService extends BaseRepository {
    constructor(
        datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(datasource, req); }

    async getAdminDashboard() {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const studentsCount = await this.getRepository(Student).createQueryBuilder('student')
            .leftJoin('student.enrollments', 'enrollments')
            .where('enrollments.academicYearId = :academicYearId', { academicYearId: currentAcademicYearId })
            .getCount();
        
        const teachersCount = await this.getRepository(Teacher).createQueryBuilder().getCount();
    
        const classRoomsCount = await this.getRepository(ClassRoom).createQueryBuilder().getCount();

        const staffsCount = await this.getRepository(Staff).createQueryBuilder().getCount();

        return {
            studentsCount,
            teachersCount,
            classRoomsCount,
            staffsCount,
        }
    }
}

