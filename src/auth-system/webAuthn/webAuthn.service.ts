import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { DataSource, FindOptionsRelations, FindOptionsSelect, IsNull, Not } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { EnvService } from 'src/env/env.service';
import { EPasskeyChallengeType, PasskeyChallenge } from './entities/passkey-challenge.entity';
import { WebAuthnCredential } from './entities/webAuthnCredential.entity';
import { LoginVerifyDto } from './dto/login-verify.dto';
import { RefreshTokenService } from '../auth/helpers/refresh-tokens.service';
import { Tokens } from 'src/common/CONSTANTS';
import { JwtService } from '../jwt/jwt.service';
import { AuthService } from '../auth/auth.service';

@Injectable({ scope: Scope.REQUEST })
export class WebAuthnService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) request: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
        private readonly envService: EnvService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ) { super(dataSource, request); }

    async registerPassKey() {
        const account = await this.getAccount(
            { id: true, email: true, webAuthnCredentials: { id: true, credentialId: true } },
            { webAuthnCredentials: true }
        );

        const challengePayload = await generateRegistrationOptions({
            rpID: this.envService.CLIENT_DOMAIN,
            rpName: 'Abhyam SMS', // Todo: udpate this value
            userName: account.email,
            timeout: 30 * 1000,
            excludeCredentials: account.webAuthnCredentials?.map(c => ({
                id: c.credentialId,
            })) ?? [],
        })

        // remove existing register challenge
        await this.getRepository(PasskeyChallenge).delete({ type: EPasskeyChallengeType.Register, email: account.email });

        // save challenge in db
        await this.getRepository(PasskeyChallenge).save({
            challenge: challengePayload.challenge,
            type: EPasskeyChallengeType.Register,
            email: account.email
        });

        return { challengePayload };
    }

    async verifyRegisterPasskey(payload: any) {
        const account = await this.getAccount({ id: true, email: true, verifiedAt: true });

        const passkeyChallenge = await this.getRepository(PasskeyChallenge).findOne({
            where: { type: EPasskeyChallengeType.Register, email: account.email },
            select: { id: true, challenge: true }
        });

        if (!passkeyChallenge) throw new ForbiddenException('Register your passkey first');

        const verificationResult = await verifyRegistrationResponse({
            expectedChallenge: passkeyChallenge.challenge,
            expectedOrigin: this.envService.CLIENT_URL,
            expectedRPID: this.envService.CLIENT_DOMAIN,
            response: payload,
        })

        if (!verificationResult.verified) throw new ForbiddenException('Invalid passkey');

        const registrationInfo = verificationResult.registrationInfo;

        // save the verified passkey        
        const newWebAuthn = this.getRepository(WebAuthnCredential).create({
            account,
            credentialId: registrationInfo.credential?.id,
            publicKey: Buffer.from(registrationInfo.credential?.publicKey), // convert Uint8Array to string
            backedUp: registrationInfo.credentialBackedUp,
            counter: registrationInfo.credential?.counter,
            deviceType: registrationInfo.credentialDeviceType,
            transports: registrationInfo.credential.transports,
            name: await this.getCredentialName(account.id),
        })

        await this.getRepository(WebAuthnCredential).save(newWebAuthn);

        await this.getRepository(PasskeyChallenge).remove(passkeyChallenge); // remvoe the challenge now

        return { message: 'Passkey registered. You can now use it to log in.', verified: true };
    }

    async getCredentialName(accountId: string) {
        const defaultName = "MY PASSKEY";

        const credentials = await this.getRepository(WebAuthnCredential).createQueryBuilder('cred')
            .where('cred.accountId = :accountId', { accountId })
            .andWhere('cred.name LIKE :defaultName', { defaultName: `${defaultName} %` })
            .limit(1)
            .select(['cred.id', 'cred.name', 'cred.createdAt'])
            .orderBy('cred.createdAt', 'DESC')
            .getOne();

        return incrementPasskey(credentials?.name ?? defaultName);
    }

    async getAccount(select?: FindOptionsSelect<Account>, relations?: FindOptionsRelations<Account>): Promise<Account> {
        const currentUser = this.utilitiesService.getCurrentUser()

        const account = await this.getRepository(Account).findOne({
            where: { id: currentUser.accountId, verifiedAt: Not(IsNull()) },
            relations: relations,
            select: select ?? { id: true }
        });
        if (!account) throw new InternalServerErrorException('Associated account not found');

        return account;
    }

    async getLoginChallenge(email: string) {
        const account = await this.getRepository(Account).findOne({
            where: { email, verifiedAt: Not(IsNull()) },
            relations: { webAuthnCredentials: true },
            select: { id: true, email: true, webAuthnCredentials: { id: true, credentialId: true, transports: true } }
        });
        if (!account) throw new BadRequestException({
            message: 'Invalid email',
            field: 'email'
        });

        const challengePayload = await generateAuthenticationOptions({
            rpID: this.envService.CLIENT_DOMAIN,
            allowCredentials: account.webAuthnCredentials?.map(c => ({
                id: c.credentialId,
                transports: c.transports
            }))
        });

        // remove previous login challenge
        await this.getRepository(PasskeyChallenge).delete({ type: EPasskeyChallengeType.Login, email: account.email });

        await this.getRepository(PasskeyChallenge).save({
            challenge: challengePayload.challenge,
            type: EPasskeyChallengeType.Login,
            email: account.email
        });

        return { challengePayload };
    }

    async verifyLoginPasskey(loginVerifyDto: LoginVerifyDto, req: FastifyRequest, reply: FastifyReply) {
        const account = await this.getRepository(Account).createQueryBuilder('account')
            .where('account.email = :email', { email: loginVerifyDto.email })
            .andWhere('account.verifiedAt IS NOT NULL')
            .leftJoin('account.webAuthnCredentials', 'webAuthnCredentials', 'webAuthnCredentials.credentialId = :credentialId', { credentialId: loginVerifyDto.authenticationResponse?.id })
            .leftJoin('account.branch', 'branch')
            .leftJoin('account.profileImage', 'profileImage')
            .select([
                'account.id',
                'account.email',
                'account.firstName',
                'account.lastName',
                'account.role',
                'webAuthnCredentials.id',
                'webAuthnCredentials.credentialId',
                'webAuthnCredentials.publicKey',
                'webAuthnCredentials.transports',
                'webAuthnCredentials.counter',
                'branch.id',
                'branch.name',
                'profileImage.id',
                'profileImage.url',
            ]).getOne();
        if (!account) throw new BadRequestException('Invalid email');

        const passkeyChallenge = await this.getRepository(PasskeyChallenge).findOne({
            where: { type: EPasskeyChallengeType.Login, email: account.email },
            select: { id: true, challenge: true }
        });
        if (!passkeyChallenge) throw new ForbiddenException('Login your passkey first');

        // now remove the challenge
        await this.getRepository(PasskeyChallenge).remove(passkeyChallenge);

        const credential = account.webAuthnCredentials[0];

        if (!credential || credential.credentialId !== loginVerifyDto.authenticationResponse?.id) throw new ForbiddenException('Invalid passkey');

        const result = await verifyAuthenticationResponse({
            expectedChallenge: passkeyChallenge.challenge,
            expectedOrigin: this.envService.CLIENT_URL,
            expectedRPID: this.envService.CLIENT_DOMAIN,
            response: loginVerifyDto.authenticationResponse,
            credential: {
                id: credential.credentialId,
                publicKey: new Uint8Array(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports
            }
        });

        if (!result.verified) throw new ForbiddenException('Invalid passkey');

        // update last used
        credential.lastUsed = new Date();
        await this.getRepository(WebAuthnCredential).save(credential);

        // NOT IT IS CONFIRMED THE USER IS A VALID ONE
        return this.login(account, req, reply);
    }

    async login(account: Account, req: FastifyRequest, reply: FastifyReply) {
        const existingRefreshCookie = req.cookies?.[Tokens.REFRESH_TOKEN_COOKIE_NAME];
        this.refreshTokenService.setEmail(account.email);

        let refreshTokens = await this.refreshTokenService.getRefreshTokens();

        const { access_token, refresh_token } = await this.jwtService.getAuthTokens(account);

        if (existingRefreshCookie) {
            const { value: existingRefreshToken, valid } = req.unsignCookie(existingRefreshCookie);

            const newRefreshTokenArray = valid
                ? (refreshTokens?.filter((rt) => rt !== existingRefreshToken) ?? [])
                : (refreshTokens ?? [])

            if (existingRefreshToken) reply.clearCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME, this.authService.getRefreshCookieOptions()); // CLEAR COOKIE, BCZ A NEW ONE IS TO BE GENERATED

            refreshTokens = [...newRefreshTokenArray];
        }

        refreshTokens = [...(refreshTokens ?? []), refresh_token];

        await this.refreshTokenService.setRefreshTokens(refreshTokens);

        return reply
            .setCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME, refresh_token, this.authService.getRefreshCookieOptions())
            .header('Content-Type', 'application/json')
            .send({
                access_token,
                user: {
                    firstName: account.firstName,
                    lastName: account.lastName,
                    profileImageUrl: account.profileImage?.url,
                    branchName: account.branch?.name,
                }
            })
    }

    async findAll() {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const credentials = await this.getRepository(WebAuthnCredential).find({
            where: { account: { id: accountId } },
            select: { id: true, name: true, createdAt: true, lastUsed: true }
        });

        return credentials;
    }

    async updateName(id: string, name: string) {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const credential = await this.getRepository(WebAuthnCredential).findOne({
            where: { id, account: { id: accountId } },
            select: { id: true, name: true }
        });

        if (!credential) throw new NotFoundException('Credential not found');

        // check if name is taken
        const existingWithSameName = await this.getRepository(WebAuthnCredential).findOne({
            where: { id: Not(credential.id), name, account: { id: accountId } },
            select: { id: true }
        });

        if (existingWithSameName) throw new BadRequestException({
            message: 'You already have a credential with this name',
            field: 'name',
        });

        await this.getRepository(WebAuthnCredential).update({ id }, { name });

        return { message: 'Name updated' }
    }

    async delete(id: string) {
        const { accountId } = this.utilitiesService.getCurrentUser();

        await this.getRepository(WebAuthnCredential).delete({ id, account: { id: accountId } });

        return { message: 'Passkey removed' }
    }
}

function incrementPasskey(passkey: string) {
    // Match the part of the string ending with a number
    const match = passkey.match(/(.*?)(\d+)?$/);
    const prefix = match[1].trim(); // The text part, trimmed for safety
    const number = match[2] ? parseInt(match[2], 10) : 0; // Default to 0 if no number found
    return `${prefix} ${number + 1}`; // Increment and reconstruct
}