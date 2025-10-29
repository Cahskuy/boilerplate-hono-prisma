import { hash, verify } from 'argon2';

export const Password = {
    hash: (plain: string) => hash(plain, { type: 2 }),
    verify: (hashed: string, plain: string) => verify(hashed, plain),
};
