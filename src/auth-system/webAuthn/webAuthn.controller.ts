import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { Public } from 'src/common/decorators/setPublicRoute.decorator';
import { WebAuthnService } from './webAuthn.service';
import { LoginChallengeDto } from './dto/login-challenge.dto';
import { LoginVerifyDto } from './dto/login-verify.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UpdateWebAuthnCredentialDto } from './dto/webAuthnCredential.dto';

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

    @Patch(':id')
    @CheckAbilities({ subject: Role.USER, action: Action.UPDATE })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() { name }: UpdateWebAuthnCredentialDto) {
        return this.webAuthnService.updateName(id, name);
    }

    @Get()
    @CheckAbilities({ subject: Role.USER, action: Action.READ })
    getCredentials() {
        return this.webAuthnService.findAll();
    }

    @Delete(':id')
    @CheckAbilities({ subject: Role.USER, action: Action.DELETE })
    delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.webAuthnService.delete(id);
    }
}
