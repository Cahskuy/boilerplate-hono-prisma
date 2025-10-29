import type { Context, Next } from 'hono';

export const requireScope = (need: string | string[]) => {
    const needs = Array.isArray(need) ? need : [need];
    return async (c: Context, next: Next) => {
        const user = c.get('user') as { scopes: string[] } | undefined;
        if (!user) return c.text('Unauthorized', 401);
        const ok = needs.every((s) => user.scopes.includes(s));
        if (!ok) return c.text('Forbidden', 403);
        await next();
    };
};
