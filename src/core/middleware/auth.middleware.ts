import { TokenService } from '@/modules/auth/services/token.service';
import type { Context, Next } from 'hono';

export async function authMiddleware(c: Context, next: Next) {
    const header = c.req.header('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return c.text('Unauthorized', 401);

    try {
        const tokens = c.var.container.resolve(TokenService);
        const claims = await tokens.verifyAccessToken(token);
        // simpan ke ctx var
        c.set('user', {
            id: claims.sub as string,
            role: claims.role,
            scopes: claims.scopes ?? [],
        });
        await next();
    } catch {
        return c.text('Unauthorized', 401);
    }
}
