import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Cache } from "cache-manager";
import { FastifyRequest } from "fastify";
import { LoginDevice } from "src/auth-system/accounts/entities/login-devices.entity";
import { BaseRepository } from "src/common/repository/base-repository";
import { EnvService } from "src/env/env.service";
import { UtilitiesService } from "src/utilities/utilities.service";
import { DataSource } from "typeorm";

export interface TRefreshToken {
    deviceId: string,
    refreshToken: string,
}

@Injectable({ scope: Scope.REQUEST })
export class RefreshTokenService extends BaseRepository {
    email: string;
    deviceId: string;

    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        private readonly envService: EnvService,
        private readonly utilitiesService: UtilitiesService
    ) { super(dataSource, req); }

    init({ email, deviceId }: { email?: string, deviceId?: string }) {
        this.email = email ?? this.utilitiesService.getCurrentUser()?.email;
        this.deviceId = deviceId ?? this.utilitiesService.getCurrentUser().deviceId;
    }

    async get() {
        const cacheKey = `user:${this.email}:${this.deviceId}`

        const token: string | null = await this.cacheManager.get(cacheKey);

        return token ? JSON.parse(token) as TRefreshToken : null
    }

    async set(refreshToken: string) {
        const cacheKey = `user:${this.email}:${this.deviceId}`

        const refreshTokenPayload: TRefreshToken = {
            deviceId: this.deviceId,
            refreshToken
        }

        await this.cacheManager.set(cacheKey, JSON.stringify(refreshTokenPayload), this.envService.REFRESH_TOKEN_EXPIRATION_SEC * 1000);
    }

    async remove() {
        const cacheKey = `user:${this.email}:${this.deviceId}`

        await this.cacheManager.del(cacheKey);
    }

    async removeAll() {
        const devices = await this.getRepository(LoginDevice).find({ where: { account: { email: this.email } }, select: { deviceId: true } });

        const keys = devices.map(d => `user:${this.email}:${d.deviceId}`);

        await this.cacheManager.mdel(keys);
    }

    async getAll() {
        const devices = await this.getRepository(LoginDevice).find({ where: { account: { email: this.email } }, select: { deviceId: true } });

        const keys = devices.map(d => `user:${this.email}:${d.deviceId}`);

        const tokens = (await this.cacheManager.mget(keys)).filter(Boolean) as string[];

        return tokens.map((token: string) => JSON.parse(token) as TRefreshToken);
    }
}