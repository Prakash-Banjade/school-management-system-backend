import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return data ? request.cookies?.[data] : request.cookies;
});

export const enum CookieKey {
    BRANCH_ID = 'branchId',
    ACADEMIC_YEAR_ID = 'academicYearId',
}

export type TCookie = {
    branchId?: string;
    academicYearId?: string;
};