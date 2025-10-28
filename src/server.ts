import 'reflect-metadata';
import { Hono } from 'hono';
import { userRoute } from '@/modules/user/user.route';
import { containerMiddleware } from '@/core/middleware/container';
import { loggerMiddleware } from '@/core/middleware/logger';
import { errorMiddleware } from '@/core/middleware/error';

const app = new Hono();

app.use('*', loggerMiddleware());
app.use('*', containerMiddleware());

app.route('/users', userRoute());
app.onError(errorMiddleware());

export default {
    port: Number(Bun.env.PORT ?? 3000),
    fetch: app.fetch,
};
