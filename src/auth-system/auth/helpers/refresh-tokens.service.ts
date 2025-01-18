import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { CacheManagerStore } from "cache-manager";
import { EnvService } from "src/env/env.service";
import { UtilitiesService } from "src/utilities/utilities.service";

export interface TRefreshToken {
    deviceId: string,
    refreshToken: string,
}

@Injectable({ scope: Scope.REQUEST })
export class RefreshTokenService {
    email: string;
    deviceId: string;

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: CacheManagerStore,
        private readonly envService: EnvService,
        private readonly utilitiesService: UtilitiesService
    ) { }

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
        const keys = await this.cacheManager.keys();

        const filteredKeys = keys.filter((key) => key.startsWith(`user:${this.email}:`));

        await this.cacheManager.mdel(...filteredKeys);
    }

    async getAll() {
        const keys = await this.cacheManager.keys();

        if (!keys?.length) return [];

        const tokens = await this.cacheManager.mget(...keys.filter((key) => key.startsWith(`user:${this.email}:`)));

        return tokens.map((token: string | null) => token ? JSON.parse(token) as TRefreshToken : null);
    }
}