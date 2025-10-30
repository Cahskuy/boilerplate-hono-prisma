import type { User } from '@prisma/client';
import type { CreateUserDto } from '../dto/create-user.dto';
export interface IUserRepository {
    create(data: CreateUserDto): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
}
