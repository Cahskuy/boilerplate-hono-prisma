import { injectable, inject } from 'tsyringe';
import { AuthService } from '../services/auth.service';
import { TOKENS } from '@/core/di/tokens.di';

@injectable()
export class RefreshSessionCommand {
    constructor(@inject(TOKENS.AuthService) private auth: AuthService) {}
    async execute(refreshToken: string) {
        return this.auth.rotate(refreshToken);
    }
}
