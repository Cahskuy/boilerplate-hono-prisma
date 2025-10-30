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
        // verifikasi JWT-nya dulu
        const payload = await this.tokens.verifyRefreshToken(oldRefresh);
        const { jti, sub } = payload;

        // ambil RT dari DB
        const rt = await this.rtRepo.findByJti(jti!);

        // nggak ada atau expired → invalid
        if (!rt || rt.expiresAt < new Date()) {
            throw Object.assign(new Error('Invalid refresh token'), {
                status: 401,
                expose: true,
            });
        }

        // kalau sudah direvoke → ini reuse detection
        if (rt.revokedAt) {
            await this.rtRepo.revokeAllForUser(rt.userId);

            throw Object.assign(new Error('Refresh token reused'), {
                status: 401,
                expose: true,
            });
        }

        // cek hash cocok gak
        const match = await this.rtRepo.verifyHash(rt.hashed, oldRefresh);
        if (!match) {
            // bisa jadi token palsu / dicopy
            await this.rtRepo.revokeAllForUser(rt.userId);

            throw Object.assign(new Error('Invalid refresh token'), {
                status: 401,
                expose: true,
            });
        }

        // pastikan usernya masih ada
        const user = await this.userRepo.findById(sub as string);
        if (!user) {
            // revoke token ini aja
            await this.rtRepo.revokeByJti(jti!);
            throw Object.assign(new Error('User not found'), {
                status: 401,
                expose: true,
            });
        }

        // revoke RT lama (karena udah dipakai)
        await this.rtRepo.revokeByJti(jti!);

        // issue pasangan baru
        return this.issue({
            id: user.id,
            role: user.role,
        });
    }
}
