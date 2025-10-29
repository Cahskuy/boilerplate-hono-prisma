import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/di/tokens.di';
import { PrismaClient } from '@prisma/client';
import { verify } from 'argon2';

@injectable()
export class PasswordStrategy {
    constructor(@inject(TOKENS.Prisma) private prisma: PrismaClient) {}

    async validate(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return null;
        }
        const ok = await verify(user.password, password);
        if (!ok) return null;

        // sanitize: jangan leak hash ke lapisan atas
        const { password: _omit, ...safe } = user;
        return safe; // { id, email, name, role }
    }
}
