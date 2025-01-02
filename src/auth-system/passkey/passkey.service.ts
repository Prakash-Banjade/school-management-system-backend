import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { DataSource, FindOptionsRelations, FindOptionsSelect, IsNull, Not } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { EnvService } from 'src/env/env.service';
import { EPasskeyChallengeType, PasskeyChallenge } from './entities/passkey-challenge.entity';
import { Passkey } from './entities/passkey.entity';

@Injectable()
export class PasskeyService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) request: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
        private readonly envService: EnvService,
    ) { super(dataSource, request); }

    async registerPassKey() {
        const account = await this.getAccount({ id: true, email: true });

        const challengePayload = await generateRegistrationOptions({
            rpID: this.envService.CLIENT_DOMAIN,
            rpName: 'My Localhost Machine', // Todo: udpate this value
            attestationType: 'none',
            userName: account.email,
            timeout: 30 * 1000,
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
        await this.getRepository(Passkey).save({
            account,
            aaguid: registrationInfo.aaguid,
            attestationObject: registrationInfo.attestationObject,
            credential: registrationInfo.credential,
            credentialDeviceType: registrationInfo.credentialDeviceType,
            fmt: registrationInfo.fmt,
            origin: registrationInfo.origin,
            rpID: registrationInfo.rpID,
        })

        return { message: 'Passkey verified successfully', verified: true };
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
}
