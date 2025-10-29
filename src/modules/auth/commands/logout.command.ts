import { injectable, inject } from 'tsyringe';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { TOKENS } from '@/core/di/tokens.di';

@injectable()
export class LogoutCommand {
    constructor(
        @inject(TOKENS.RefreshTokenRepository)
        private repo: RefreshTokenRepository
    ) {}
    async execute(jti: string) {
        await this.repo.revokeByJti(jti);
    }
}
