import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/core/di/tokens.di';
import { hash, verify } from 'argon2';
import { PrismaClient } from '@prisma/client';

@injectable()
export class RefreshTokenRepository {
    constructor(@inject(TOKENS.Prisma) private prisma: PrismaClient) {}

    async create(params: {
        jti: string;
        token: string;
        userId: string;
        ua?: string;
        ip?: string;
        expiresAt: Date;
    }) {
        const hashed = await hash(params.token);
        return this.prisma.refreshToken.create({
            data: {
                jti: params.jti,
                userId: params.userId,
                hashed,
                userAgent: params.ua,
                ip: params.ip,
                expiresAt: params.expiresAt,
            },
        });
    }

    async verifyAndGet(jti: string, token: string) {
        const rt = await this.prisma.refreshToken.findUnique({
            where: { jti },
        });
        if (!rt || rt.revokedAt || rt.expiresAt < new Date()) return null;
        const ok = await verify(rt.hashed, token);
        return ok ? rt : null;
    }

    async revokeByJti(jti: string) {
        const token = await this.prisma.refreshToken.findUnique({
            where: { jti },
        });
        if (!token) {
            throw Object.assign(new Error('Invalid refresh token'), {
                status: 401,
                expose: true,
            });
        }

        await this.prisma.refreshToken.update({
            where: { jti },
            data: { revokedAt: new Date() },
        });
    }

    async revokeAllForUser(userId: string) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
}
