import { z } from 'zod';
export const CreateUserSchema = z.object({
    email: z.email(),
    name: z.string().min(1),
    password: z.string().min(6),
    role: z.string(),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
