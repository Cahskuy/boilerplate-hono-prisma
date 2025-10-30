import { injectable, inject } from 'tsyringe';
import { randomUUID } from 'crypto';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { TokenService } from './token.service';
import { security } from '@/config/security.config';
import { TOKENS } from '@/core/di/tokens.di';
import type { IUserRepository } from '@/modules/user/repositories/user.repository';

@injectable()
export class AuthService {
    constructor(
        @inject(TOKENS.TokenService) private tokens: TokenService,
        @inject(TOKENS.RefreshTokenRepository)
        private rtRepo: RefreshTokenRepository,
        @inject(TOKENS.UserRepository) private userRepo: IUserRepository
    ) {}

    async issue(
        user: { id: string; role: string; scopes?: string[] },
        ctxMeta?: { ua?: string; ip?: string }
    ) {
        const jti = randomUUID();
        const access = await this.tokens.signAccessToken({
            sub: user.id,
            role: user.role,
            scopes: user.scopes,
        });
        const refresh = await this.tokens.signRefreshToken(jti, user.id);

        const expiresAt = new Date(Date.now() + security.refreshTtlSec * 1000);
        await this.rtRepo.create({
            jti,
            token: refresh,
            userId: user.id,
            ua: ctxMeta?.ua,
            ip: ctxMeta?.ip,
            expiresAt,
        });

        return { access, refresh };
    }

    async rotate(oldRefresh: string) {
        // verify JWT
        const payload = await this.tokens.verifyRefreshToken(oldRefresh);
        const { jti, sub } = payload;
        // check DB match + not revoked
        const ok = await this.rtRepo.verifyAndGet(jti!, oldRefresh);
        if (!ok)
            throw Object.assign(new Error('Invalid refresh token'), {
                status: 401,
                expose: true,
            });

        const user = await this.userRepo.findById(sub as string);
        if (!user) {
            // sekalian revoke RT biar ga dipakai
            await this.rtRepo.revokeByJti(jti!);
            throw Object.assign(new Error('User not found'), {
                status: 401,
                expose: true,
            });
        }

        const role = user.role;

        // revoke old
        await this.rtRepo.revokeByJti(jti!);

        // issue new pair
        const accessRefresh = await this.issue({
            id: sub as string,
            role: role,
        });
        return accessRefresh;
    }
}
