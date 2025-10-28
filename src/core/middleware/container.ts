import type { Context, Next } from 'hono';
import { buildContainer } from '@/core/di/container';

const root = buildContainer();

export const containerMiddleware = () => async (c: Context, next: Next) => {
    c.set('container', root.createChildContainer?.() ?? root); // request-scope
    await next();
};

declare module 'hono' {
    interface ContextVariableMap {
        container: ReturnType<typeof buildContainer>;
    }
}
