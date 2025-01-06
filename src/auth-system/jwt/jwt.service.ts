import { Injectable } from '@nestjs/common';
import { JwtService as JwtSer } from '@nestjs/jwt';
import { AuthUser, Role } from 'src/common/types/global.type';
import { Account } from '../accounts/entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from 'src/students/entities/student.entity';
import { Repository } from 'typeorm';
import { EnvService } from 'src/env/env.service';
import { FastifyRequest } from 'fastify';
import { generateDeviceId } from 'src/utils/utils';

@Injectable()
export class JwtService {
    constructor(
        private readonly jwtService: JwtSer,
        private readonly envService: EnvService,
        @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    ) { }

    async createAccessToken(payload: AuthUser): Promise<string> {
        return await this.jwtService.signAsync(payload, {
            secret: this.envService.ACCESS_TOKEN_SECRET,
            expiresIn: this.envService.ACCESS_TOKEN_EXPIRATION_SEC,
        });
    }

    async createRefreshToken(payload: Pick<AuthUser, 'accountId'>): Promise<string> {
        return await this.jwtService.signAsync(
            { accountId: payload.accountId },
            {
                secret: this.envService.REFRESH_TOKEN_SECRET,
                expiresIn: this.envService.REFRESH_TOKEN_EXPIRATION_SEC,
            },
        );
    }

    async getSudoAccessToken(accountId: string): Promise<string> {
        return this.jwtService.signAsync(
            { accountId },
            {
                secret: this.envService.SUDO_ACCESS_TOKEN_SECRET,
                expiresIn: this.envService.SUDO_ACCESS_TOKEN_EXPIRATION_SEC,
            }
        );
    }

    /**
     * the payload will contain additional `classRoomId` if the user is a student
     * @param account the account
     * @returns the access and refresh tokens
     */
    async getAuthTokens(account: Account, req: FastifyRequest) {
        let payload: AuthUser;

        const deviceId = generateDeviceId(req.headers['user-agent'], req.ip);

        if (account.role === Role.STUDENT) {
            const student = await this.studentRepo.findOne({
                where: {
                    account: { id: account.id },
                },
                relations: {
                    classRoom: true,
                    account: { branch: true },
                },
                select: {
                    id: true,
                    classRoom: { id: true },
                    account: { id: true, branch: { id: true } }
                }
            });

            payload = {
                accountId: account.id,
                email: account.email,
                role: Role.STUDENT,
                classRoomId: student.classRoom.id,
                studentId: student.id,
                branchId: student.account?.branch?.id ?? undefined,
                deviceId,
            };
        } else {
            payload = {
                accountId: account.id,
                email: account.email,
                role: account.role,
                branchId: account.branch?.id ?? undefined,
                deviceId,
            };
        }

        const access_token = await this.createAccessToken(payload);
        const refresh_token = await this.createRefreshToken(payload);

        return { access_token, refresh_token };
    }
}
