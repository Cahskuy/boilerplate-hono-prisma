import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/core/di/tokens.di';
import { PasswordStrategy } from '../strategies/password.strategy';
import { AuthService } from '../services/auth.service';

@injectable()
export class LoginCommand {
    constructor(
        @inject(TOKENS.PasswordStrategy) private strategy: PasswordStrategy,
        @inject(TOKENS.AuthService) private auth: AuthService
    ) {}

    async execute(
        email: string,
        password: string,
        meta?: { ua?: string; ip?: string }
    ) {
        const user = await this.strategy.validate(email, password);
        if (!user)
            throw Object.assign(new Error('Invalid credentials'), {
                status: 401,
            });
        return this.auth.issue({ id: user.id, role: user.role }, meta);
    }
}
