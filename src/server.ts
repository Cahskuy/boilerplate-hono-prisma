import 'reflect-metadata';
import { Hono } from 'hono';
import { authRoute } from './modules/auth/auth.route';
import { userRoute } from '@/modules/user/user.route';
import { containerMiddleware } from '@/core/middleware/container.middleware';
import { loggerMiddleware } from '@/core/middleware/logger.middleware';
import { errorMiddleware } from '@/core/middleware/error.middleware';

const app = new Hono();

app.use('*', loggerMiddleware());
app.use('*', containerMiddleware());

app.route('/auth', authRoute);
app.route('/users', userRoute());
app.onError(errorMiddleware());

// contoh proteksi:
// app.get('/users/me', authMiddleware, (c) => {
//   const user = c.get('user');
//   return c.json({ user });
// });

// // contoh proteksi + scope
// app.get('/admin/dashboard', authMiddleware, requireScope('admin:read'), (c) => {
//   return c.text('secret');
// });

export default {
    port: Number(Bun.env.PORT ?? 3000),
    fetch: app.fetch,
};
