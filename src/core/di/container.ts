import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './tokens';
import { prisma } from '@/infrastructure/prisma/client';
import { UserPrismaRepository } from '@/modules/user/repositories/user.prisma.repository';
import { UserService } from '@/modules/user/services/user.service';

export function buildContainer() {
    container.register(TOKENS.Prisma, { useValue: prisma });
    container.register(TOKENS.UserRepository, {
        useClass: UserPrismaRepository,
    });
    container.register(TOKENS.UserService, { useClass: UserService });
    return container;
}
