import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { FastifyRequest } from 'fastify';
import { CACHE_KEYS, CookieKey } from 'src/common/CONSTANTS';
import { AuthUser } from 'src/common/types/global.type';
import { generateDeviceId } from 'src/utils/utils';
import { SelectQueryBuilder } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class UtilitiesService {
    constructor(
        @Inject(REQUEST) private readonly request: FastifyRequest,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    getCurrentUser(): AuthUser {
        return this.request.user;
    }

    getBranchId(): string | undefined {
        return this.request?.user?.branchId ?? this.request.cookies[CookieKey.BRANCH_ID];
    }

    async getAcademicYearId(): Promise<string | undefined> {
        return this.request?.cookies[CookieKey.ACADEMIC_YEAR_ID] ?? await this.cacheManager.get(CACHE_KEYS.CAY_ID);
    }

    applyBranchFilter<T>(queryBuilder: SelectQueryBuilder<T>, query?: string): SelectQueryBuilder<T> {
        const branchId = this.getBranchId();

        if (branchId) queryBuilder.andWhere(query ?? 'account.branchId = :branchId', { branchId });

        return queryBuilder;
    }

}
