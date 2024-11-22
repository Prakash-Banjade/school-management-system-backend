import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { FastifyRequest } from 'fastify';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Student } from 'src/students/entities/student.entity';
import { DataSource } from 'typeorm';
import { StudentLedger } from './entities/student-ledger.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';

@Injectable()
export class StudentLedgersService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(dataSource, req); }

    async createStudentsLedger() {
        const academicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const students = await this.getRepository(Student).createQueryBuilder('student')
            .leftJoin('student.enrollments', 'enrollments')
            .where('enrollments.academicYearId = :academicYearId', { academicYearId: academicYearId })
            .select(['student.id', 'enrollments.id'])
            .getMany();

        const enrollments = students.map(student => {
            const enrollment = student.enrollments[0];
            enrollment.ledger = this.getRepository(StudentLedger).create();
            return enrollment;
        });

        await this.getRepository(Enrollment).save(enrollments);
    }

}
