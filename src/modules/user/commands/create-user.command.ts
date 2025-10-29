import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/core/di/tokens.di';
import type { CreateUserDto } from '../dto/create-user.dto';
import { UserService } from '../services/user.service';

@injectable()
export class CreateUserCommand {
    constructor(@inject(TOKENS.UserService) private svc: UserService) {}
    exec(dto: CreateUserDto) {
        return this.svc.create(dto);
    }
}
