import { Hono } from 'hono';
import { CreateUserSchema } from './dto/create-user.dto';
import { CreateUserCommand } from './commands/create-user.command';
import { zodMiddleware } from '@/core/middleware/zod';

export const userRoute = () => {
    const r = new Hono();

    r.post('/', zodMiddleware({ body: CreateUserSchema }), async (c) => {
        const body = await c.req.json();
        const dto = CreateUserSchema.parse(body);
        const cmd = c.var.container.resolve(CreateUserCommand);
        const user = await cmd.exec(dto);
        return c.json({ id: user.id, email: user.email, name: user.name }, 201);
    });

    return r;
};
