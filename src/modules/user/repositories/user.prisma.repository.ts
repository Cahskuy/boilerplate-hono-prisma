import type { IUserRepository } from './user.repository';
import type { CreateUserDto } from '../dto/create-user.dto';
import type { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/di/tokens';

@injectable()
export class UserPrismaRepository implements IUserRepository {
    constructor(@inject(TOKENS.Prisma) private prisma: PrismaClient) {}
    create(data: CreateUserDto) {
        return this.prisma.user.create({ data });
    }
    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }
}
