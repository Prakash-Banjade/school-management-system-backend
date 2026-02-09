import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { Tokens } from "../CONSTANTS";
import { EnvService } from "src/env/env.service";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private readonly envService: EnvService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const reply = context.switchToHttp().getResponse<FastifyReply>();
        const refresh_token = request.cookies?.[Tokens.REFRESH_TOKEN_COOKIE_NAME];
        if (!refresh_token) throw new ForbiddenException();

        const { valid, value: refreshCookieValue } = request.unsignCookie(refresh_token);

        if (!valid) throw new ForbiddenException();

        try {
            const { accountId, asGuest } = await this.jwtService.verifyAsync(refreshCookieValue, {
                secret: this.envService.REFRESH_TOKEN_SECRET,
            })

            const isLogout = request.url === '/api/auth/logout';
            if (asGuest && !isLogout) throw new ForbiddenException();

            request.accountId = accountId;
        } catch (e) {
            reply.clearCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME)
            if (e instanceof ForbiddenException) throw e;
            throw new UnauthorizedException();
        }
        return true;
    }
}
