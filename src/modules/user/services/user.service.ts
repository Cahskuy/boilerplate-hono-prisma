import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/di/tokens';
import type { IUserRepository } from '../repositories/user.repository';
import type { CreateUserDto } from '../dto/create-user.dto';

@injectable()
export class UserService {
    constructor(@inject(TOKENS.UserRepository) private repo: IUserRepository) {}
    async create(input: CreateUserDto) {
        const exist = await this.repo.findByEmail(input.email);
        if (exist)
            throw Object.assign(new Error('Email already used'), {
                status: 409,
                expose: true,
            });
        return this.repo.create(input);
    }
}
