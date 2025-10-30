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

    async findByJti(jti: string) {
        return this.prisma.refreshToken.findUnique({
            where: { jti },
        });
    }

    async verifyHash(hashed: string, raw: string) {
        return verify(hashed, raw);
    }

    async revokeByJti(jti: string) {
        await this.prisma.refreshToken.updateMany({
            where: { jti, revokedAt: null },
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
