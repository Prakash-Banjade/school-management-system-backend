import { Body, Controller, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { Public } from 'src/common/decorators/setPublicRoute.decorator';
import { WebAuthnService } from './webAuthn.service';
import { LoginChallengeDto } from './dto/login-challenge.dto';
import { LoginVerifyDto } from './dto/login-verify.dto';
import { FastifyReply, FastifyRequest } from 'fastify';

@Controller('web-authn')
export class WebAuthnController {
    constructor(
        private readonly webAuthnService: WebAuthnService
    ) { }

    @Post('register')
    @CheckAbilities({ subject: Role.USER, action: Action.CREATE })
    @UseInterceptors(TransactionInterceptor)
    register() {
        return this.webAuthnService.registerPassKey();
    }

    @Post('verify-register')
    @CheckAbilities({ subject: Role.USER, action: Action.CREATE })
    @UseInterceptors(TransactionInterceptor)
    verifyRegisterPasskey(@Body('registrationResponse') payload: any) {
        return this.webAuthnService.verifyRegisterPasskey(payload);
    }

    @Post('login')
    @Public()
    @UseInterceptors(TransactionInterceptor)
    getLoginChallenge(@Body() { email }: LoginChallengeDto) {
        return this.webAuthnService.getLoginChallenge(email);
    }

    @Post('verify-login')
    @Public()
    @UseInterceptors(TransactionInterceptor)
    verifyLogin(@Body() loginVerifyDto: LoginVerifyDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.webAuthnService.verifyLoginPasskey(loginVerifyDto, req, reply);
    }
}
