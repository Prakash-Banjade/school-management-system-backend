import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiConsumes, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterDto } from './dto/register.dto';
import { SignInDto } from './dto/signIn.dto';
import { Public } from 'src/common/decorators/setPublicRoute.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { FormDataRequest } from 'nestjs-form-data';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { EmailOnlyDto } from './dto/email-only.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { AuthHelper } from './helpers/auth.helper';
import { OtpVerificationDto } from './dto/otp-verification.dto';
import { Auth2faHelper } from './helpers/auth-2fa.helper';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authHelper: AuthHelper,
        private readonly auth2faHelper: Auth2faHelper,
    ) { }

    @Public()
    @Post('login')
    @UseInterceptors(TransactionInterceptor)
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    login(
        @Body() signInDto: SignInDto,
        @Req() request: FastifyRequest,
        @Res({ passthrough: true }) response: FastifyReply,
    ) {
        return this.authService.login(signInDto, request, response);
    }

    @Public()
    @Post('refresh')
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshTokenGuard)
    refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
        return this.authService.refresh(req, res);
    }

    // @Public()
    // @Post('register')
    @ApiExcludeEndpoint()
    @UseInterceptors(TransactionInterceptor)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('verify-email')
    @UseInterceptors(TransactionInterceptor)
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    verifyEmail(@Body() otpVerificationDto: OtpVerificationDto, @Req() req: FastifyRequest) {
        return this.authService.verifyEmail(otpVerificationDto, req);
    }

    @Public()
    @Post('verify-email-confirm-token')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    verifyEmailResetToken(@Body() { token }: VerifyTokenDto) {
        return this.authService.verifyEmailResetToken(token);
    }

    @Post('logout')
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    @UseGuards(RefreshTokenGuard)
    @CheckAbilities({ subject: Role.USER, action: Action.READ })
    logout(@Res({ passthrough: true }) res: FastifyReply) {
        return this.authService.logout(res);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    @UseInterceptors(TransactionInterceptor)
    @CheckAbilities({ subject: Role.USER, action: Action.UPDATE })
    changePassword(@Body() changePasswordDto: ChangePasswordDto, @CurrentUser() currentUser: AuthUser) {
        return this.authService.changePassword(changePasswordDto, currentUser);
    }


    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    @UseInterceptors(TransactionInterceptor)
    forgotPassword(@Body() { email }: EmailOnlyDto) {
        return this.authService.forgotPassword(email)
    }

    @Public()
    @Post('verify-pwd-reset-token')
    @HttpCode(HttpStatus.OK)
    verifyResetToken(@Body() verifyTokenDto: VerifyTokenDto) {
        return this.authService.verifyResetToken(verifyTokenDto.token)
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    @UseInterceptors(TransactionInterceptor)
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Post('update-email')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    updateEmail(@Body() updateEmailDto: UpdateEmailDto, @CurrentUser() currentUser: AuthUser) {
        return this.authService.updateEmail(updateEmailDto, currentUser);
    }

    @Post('verify-sudo')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('multipart/form-data')
    @FormDataRequest()
    @CheckAbilities({ subject: Role.USER, action: Action.READ })
    verifySudoPassword(@Body('sudo_password') password: string, @Res({ passthrough: true }) res: FastifyReply) {
        return this.authHelper.verifySudoPassword(password, res);
    }

    @Public()
    @Post('send-two-fa-otp')
    @HttpCode(HttpStatus.OK)
    send2faOtp(@Body() { email }: EmailOnlyDto, @Req() req: FastifyRequest) {
        return this.auth2faHelper.send2faOtp(email, req);
    }

    @Public()
    @Post('verify-two-fa-otp')
    @HttpCode(HttpStatus.OK)
    verify2faOtp(@Body() dto: OtpVerificationDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.auth2faHelper.verify2faOtp(dto, req, reply);
    }
}
