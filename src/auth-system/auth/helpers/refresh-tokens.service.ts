import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { Cache } from "cache-manager";
import { EnvService } from "src/env/env.service";

@Injectable({ scope: Scope.REQUEST })
export class RefreshTokenService {
    email: string;

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        private readonly envService: EnvService,
    ) { }

    setEmail(email: string) {
        this.email = email;
    }

    async getRefreshTokens(): Promise<string[] | undefined> {
        const cacheKey = `user:${this.email}`

        const cache: string | null = await this.cacheManager.get(cacheKey);

        return cache ? JSON.parse(cache) as string[] : undefined
    }

    // TODO: must use different ttl for each refreshtoken
    async setRefreshTokens(refreshTokens: string[] | undefined) {
        const cacheKey = `user:${this.email}`

        !!refreshTokens && await this.cacheManager.set(cacheKey, JSON.stringify(refreshTokens), this.envService.REFRESH_TOKEN_EXPIRATION_SEC * 1000);
    }
}