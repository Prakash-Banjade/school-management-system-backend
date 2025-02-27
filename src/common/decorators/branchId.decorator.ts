import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CookieKey } from './cookies.decorator';

export const BranchId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();
        return request?.user?.branchId ?? request.cookies[CookieKey.BRANCH_ID];
    },
);