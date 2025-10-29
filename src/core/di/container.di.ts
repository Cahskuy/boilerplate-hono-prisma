import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './tokens.di';
import { prisma } from '@/infrastructure/prisma/client.prisma';
import { UserPrismaRepository } from '@/modules/user/repositories/user.prisma.repository';
import { UserService } from '@/modules/user/services/user.service';
import { RefreshTokenRepository } from '@/modules/auth/repositories/refresh-token.repository';
import { AuthService } from '@/modules/auth/services/auth.service';
import { TokenService } from '@/modules/auth/services/token.service';
import { PasswordStrategy } from '@/modules/auth/strategies/password.strategy';

export function buildContainer() {
    container.registerInstance(TOKENS.Prisma, prisma);

    container.register(TOKENS.UserRepository, {
        useClass: UserPrismaRepository,
    });
    container.registerSingleton(TOKENS.UserService, UserService);

    container.register(TOKENS.RefreshTokenRepository, {
        useClass: RefreshTokenRepository,
    });
    container.registerSingleton(TOKENS.AuthService, AuthService);
    container.registerSingleton(TOKENS.TokenService, TokenService);

    container.registerSingleton(TOKENS.PasswordStrategy, PasswordStrategy);
    return container;
}
