import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { Public } from 'src/common/decorators/setPublicRoute.decorator';
import { WebAuthnService } from './webAuthn.service';
import { AuthChallengeDto } from './dto/login-challenge.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UpdateWebAuthnCredentialDto } from './dto/webAuthnCredential.dto';
import { AuthVerifyDto } from './dto/login-verify.dto';
import { SudoGuard } from 'src/common/guards/sudo.guard';

@Controller('web-authn')
export class WebAuthnController {
    constructor(
        private readonly webAuthnService: WebAuthnService
    ) { }

    @Post('register-challenge')
    @CheckAbilities({ subject: Role.USER, action: Action.CREATE })
    @UseInterceptors(TransactionInterceptor)
    @UseGuards(SudoGuard)
    register(@Req() req: FastifyRequest) {
        return this.webAuthnService.registerPassKey(req);
    }

    @Post('verify-register')
    @CheckAbilities({ subject: Role.USER, action: Action.CREATE })
    @UseInterceptors(TransactionInterceptor)
    verifyRegisterPasskey(@Body('registrationResponse') payload: any) {
        return this.webAuthnService.verifyRegisterPasskey(payload);
    }

    @Post('auth-challenge')
    @Public()
    @UseInterceptors(TransactionInterceptor)
    getAuthChallenge(@Body() dto: AuthChallengeDto) {
        return this.webAuthnService.getAuthChallenge(dto);
    }

    @Post('verify-login')
    @Public()
    @UseInterceptors(TransactionInterceptor)
    verifyLogin(@Body() dto: AuthVerifyDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.webAuthnService.verifyLoginPasskey(dto, req, reply);
    }

    @Post('verify-sudo')
    @UseInterceptors(TransactionInterceptor)
    @CheckAbilities({ subject: Role.USER, action: Action.CREATE })
    verifySudoPasskey(@Body('authenticationResponse') data: any, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.webAuthnService.verifySudoPasskey(data, reply);
    }

    @Post('verify-2fa')
    @Public()
    @UseInterceptors(TransactionInterceptor)
    verify2faPasskey(@Body() dto: AuthVerifyDto, @Res({ passthrough: true }) reply: FastifyReply, @Req() req: FastifyRequest) {
        return this.webAuthnService.verify2faPasskey(dto, reply, req);
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
