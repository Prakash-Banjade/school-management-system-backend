import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CookieKey } from './cookies.decorator';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();
        const branchId = request?.user?.branchId ?? request.cookies[CookieKey.BRANCH_ID];

        const user = { ...request.user, branchId };

        return user;
    },
);