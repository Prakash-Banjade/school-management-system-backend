import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';
import { CookieKey } from 'src/common/decorators/cookies.decorator';
import { AuthUser } from 'src/common/types/global.type';
import { SelectQueryBuilder } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class UtilitiesService {
    constructor(
        @Inject(REQUEST) private readonly request: FastifyRequest,
        private readonly academicYearService: AcademicYearsService,
    ) { }

    getCurrentUser(): AuthUser {
        return this.request.user;
    }

    getBranchId(): string | undefined {
        return this.request?.user?.branchId ?? this.request.cookies[CookieKey.BRANCH_ID];
    }

    async getAcademicYearId(): Promise<string | undefined> {
        const fromRequest = this.request.query["academicYearId"];
        if (!!fromRequest) return fromRequest;

        const fromCookie: string | undefined = this.request?.cookies[CookieKey.ACADEMIC_YEAR_ID];

        if (fromCookie) {
            const { valid, value } = this.request.unsignCookie(fromCookie);
            return valid ? value : fromRequest;
        }

        return this.academicYearService.getCurrentAcademicYearId();
    }

    applyBranchFilter<T>(queryBuilder: SelectQueryBuilder<T>, query?: string): SelectQueryBuilder<T> {
        const branchId = this.getBranchId();

        if (branchId) queryBuilder.andWhere(query ?? 'account.branchId = :branchId', { branchId });

        return queryBuilder;
    }

}
