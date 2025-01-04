import { BadRequestException, Inject, Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import { generateOtp } from "src/utils/generateOPT";
import * as crypto from 'crypto'
import { BaseRepository } from "src/common/repository/base-repository";
import { DataSource, IsNull, Not } from "typeorm";
import { FastifyReply, FastifyRequest } from "fastify";
import { REQUEST } from "@nestjs/core";
import { EmailVerificationPending } from "../entities/email-verification-pending.entity";
import { JwtService as JwtSer, TokenExpiredError } from "@nestjs/jwt";
import { EmailVerificationDto } from "../dto/email-verification.dto";
import * as bcrypt from 'bcrypt';
import { EncryptionService } from "src/auth-system/encryption/encryption.service";
import { INVALID_AUTH_CREDENTIALS_MSG, Tokens } from "src/common/CONSTANTS";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MailEvents } from "src/mail/mail.service";
import { ConfirmationMailEventDto } from "src/mail/dto/events.dto";
import { IVerifyEncryptedHashTokenPairReturn } from "./interface";
import { EnvService } from "src/env/env.service";
import { UtilitiesService } from "src/utilities/utilities.service";
import { JwtService } from "src/auth-system/jwt/jwt.service";

@Injectable({ scope: Scope.REQUEST })
export class AuthHelper extends BaseRepository {
    constructor(
        private readonly datasource: DataSource,
        @Inject(REQUEST) req: FastifyRequest,
        private readonly jwtService: JwtSer,
        private readonly myJwtService: JwtService,
        private readonly envService: EnvService,
        private readonly encryptionService: EncryptionService,
        private readonly eventEmitter: EventEmitter2,
        private readonly utilitiesService: UtilitiesService
    ) {
        super(datasource, req);
    }

    private readonly emailVerificationPendingRepo = this.datasource.getRepository<EmailVerificationPending>(EmailVerificationPending)
    private readonly accountsRepo = this.datasource.getRepository<Account>(Account);

    /**
     * Verification token generation:
     * 
     * 1. Generate a jwt token with email as payload
     * 2. Encrypt the jwt token
     * 3. Hash the encrypted token
     * 4. Save the hashed token in db
     * 5. Send the encrypted token to the user's email
     */
    async sendEmailConfirmation(account: Account) {
        const otp = generateOtp();
        const verificationToken = await this.jwtService.signAsync(
            { email: account.email },
            {
                secret: this.envService.EMAIL_VERIFICATION_SECRET,
                expiresIn: this.envService.EMAIL_VERIFICATION_EXPIRATION_SEC,
            }
        );

        const encryptedVerificationToken = this.encryptionService.encrypt(verificationToken);

        const hashedVerificationToken = crypto
            .createHash('sha256')
            .update(encryptedVerificationToken)
            .digest('hex');

        // check for existing verification pending
        const existingVerificationRequest = await this.emailVerificationPendingRepo.findOneBy({ email: account.email });

        if (existingVerificationRequest) { // update the existing one
            Object.assign(existingVerificationRequest, {
                otp: String(otp),  // opt is saved as hash in db, logic is implemented in email-verification-pending.entity.ts
                hashedVerificationToken,
            })

            await this.emailVerificationPendingRepo.save(existingVerificationRequest);
        } else { // create new one
            const emailVerificationPending = this.emailVerificationPendingRepo.create({
                email: account.email,
                otp: String(otp),
                hashedVerificationToken,
            });
            await this.emailVerificationPendingRepo.save(emailVerificationPending);
        }

        // send mail
        this.eventEmitter.emit(MailEvents.CONFIRMATION, new ConfirmationMailEventDto({
            otp,
            expirationMin: this.envService.EMAIL_VERIFICATION_EXPIRATION_SEC / 60,
            receiverEmail: account.email,
            receiverName: account.firstName + ' ' + account.lastName,
            token: encryptedVerificationToken
        }));

        return {
            message: "An OTP has been sent to your email. Please use the OTP to verify your account."
        }
    }

    async verifyPendingEmail(emailVerificationDto: EmailVerificationDto): Promise<EmailVerificationPending> {
        const { otp, verificationToken } = emailVerificationDto;

        let payload: { email: string };
        try {
            const decryptedToken = this.encryptionService.decrypt(verificationToken);
            // verify jwt token
            payload = await this.jwtService.verifyAsync(decryptedToken, {
                secret: this.envService.EMAIL_VERIFICATION_SECRET,
            });
        } catch (e) {
            if (e instanceof TokenExpiredError) throw new BadRequestException({
                error: 'TokenExpiredError',
                message: 'OTP has been expired'
            });
            throw new BadRequestException('Invalid token')
        }

        const foundRequest = await this.emailVerificationPendingRepo.findOneBy({ email: payload.email })

        const verificationTokenHash = crypto
            .createHash('sha256')
            .update(verificationToken) // this is supposed to be encrypted token, if not, it's invalid
            .digest('hex')

        // comapre the token has with found request hash
        if (verificationTokenHash !== foundRequest.hashedVerificationToken) throw new BadRequestException('Invalid token received');

        // CHECK IF OTP IS VALID
        const isOtpValid = bcrypt.compareSync(String(otp), foundRequest.otp);
        if (!isOtpValid) throw new BadRequestException('Invalid OTP');

        return foundRequest;
    }

    /**
     * Returns Account object if credentials are valid. 
     * If account is not verified, send confirmation email
     */
    async validateAccount(email: string, password: string): Promise<Account | { message: string }> {
        const foundAccount = await this.accountsRepo.findOne({
            where: { email },
            relations: { branch: true, profileImage: true },
            select: { branch: { id: true, name: true }, profileImage: { url: true } },
        });

        if (!foundAccount) throw new UnauthorizedException(INVALID_AUTH_CREDENTIALS_MSG);

        // if account is not verified, send confirmation email
        if (!foundAccount.verifiedAt) return await this.sendEmailConfirmation(foundAccount);

        const isPasswordValid = await bcrypt.compare(
            password,
            foundAccount.password,
        );

        if (!isPasswordValid) throw new UnauthorizedException(INVALID_AUTH_CREDENTIALS_MSG)

        return foundAccount;
    }

    /**
     * Generates a token pair [encrypted, hashedEncryptedToken] for the provided payload with the provided secret and expiration
     * 
     * @returns [encryptedToken, hashedEncryptedToken]
     */
    async getEncryptedHashTokenPair(payload: any, secret: string, expiration: number): Promise<[string, string]> {
        const token = await this.jwtService.signAsync(
            payload,
            {
                secret,
                expiresIn: expiration,
            }
        );

        const encryptedToken = this.encryptionService.encrypt(token);

        const hashedToken = crypto
            .createHash('sha256')
            .update(encryptedToken)
            .digest('hex');

        return [encryptedToken, hashedToken];
    }

    async verifyEncryptedHashTokenPair<T>(encryptedToken: string, secret: string): Promise<IVerifyEncryptedHashTokenPairReturn<T>> {
        const tokenHash = crypto
            .createHash('sha256')
            .update(encryptedToken)
            .digest('hex');

        try {
            const decryptedToken = this.encryptionService.decrypt(encryptedToken);
            const payload = await this.jwtService.verifyAsync(decryptedToken, { // verify if the jwt is valid
                secret,
            });

            return { payload, tokenHash, error: null };
        } catch (e) {
            return { payload: null, tokenHash: null, error: e };
        }
    }

    async verifySudoPassword(password: string, reply: FastifyReply) {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const account = await this.getRepository(Account).findOne({
            where: { id: accountId, verifiedAt: Not(IsNull()) },
            select: { id: true, password: true }
        });
        if (!account) return { verified: false };

        const isPasswordValid = await bcrypt.compare(password, account.password);

        if (!isPasswordValid) return { verified: false };

        const sudoAccessToken = await this.myJwtService.getSudoAccessToken(account.id);

        return reply
            .setCookie(
                Tokens.SUDO_ACCESS_TOKEN_COOKIE_NAME,
                sudoAccessToken,
                {
                    secure: this.envService.NODE_ENV === 'production',
                    httpOnly: true,
                    signed: true,
                    sameSite: this.envService.NODE_ENV === 'production' ? 'none' : 'lax',
                    expires: new Date(Date.now() + (this.envService.SUDO_ACCESS_TOKEN_EXPIRATION_SEC * 1000)),
                    path: '/',
                }
            )
            .header('Content-Type', 'application/json')
            .send({ verified: true })
    }
}