import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cache } from "cache-manager";

@Injectable({ scope: Scope.REQUEST })
export class RefreshTokenService {
    email: string;

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        private readonly configService: ConfigService,
    ) { }

    private readonly REFRESH_TOKEN_EXPIRATION_SEC = +this.configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRATION_SEC');

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

        !!refreshTokens && await this.cacheManager.set(cacheKey, JSON.stringify(refreshTokens), this.REFRESH_TOKEN_EXPIRATION_SEC * 1000);
    }
}