import { Hono } from 'hono';
import { getCookie, deleteCookie } from 'hono/cookie';
import { LoginDto } from './dto/login.dto';
import { LoginCommand } from './commands/login.command';
import { RefreshSessionCommand } from './commands/refresh-session.command';
import { LogoutCommand } from './commands/logout.command';
import { TokenService } from './services/token.service';
import { security } from '../../config/security.config';

export const authRoute = new Hono();

// login
authRoute.post('/login', async (c) => {
    const body = await c.req.json();
    const parsed = LoginDto.safeParse(body);
    if (!parsed.success) return c.json({ message: 'Invalid input' }, 400);

    const cmd = c.var.container.resolve(LoginCommand);
    const { access, refresh } = await cmd.execute(
        parsed.data.email,
        parsed.data.password,
        {
            ua: c.req.header('user-agent') ?? '',
            ip:
                c.req.header('x-forwarded-for') ||
                c.req.header('x-real-ip') ||
                'unknown',
        }
    );

    // set HttpOnly cookie untuk refresh
    c.header(
        'Set-Cookie',
        `${security.cookieName}=${refresh}; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=${security.refreshTtlSec}`
    );

    return c.json({ accessToken: access });
});

// refresh (ambil dari cookie)
authRoute.post('/refresh', async (c) => {
    const cookie = c.req.header('Cookie') ?? '';
    const match = cookie.match(new RegExp(`${security.cookieName}=([^;]+)`));
    const rt = match?.[1];
    if (!rt) return c.text('No refresh token', 401);

    const cmd = c.var.container.resolve(RefreshSessionCommand);
    const { access, refresh } = await cmd.execute(rt);

    c.header(
        'Set-Cookie',
        `${security.cookieName}=${refresh}; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=${security.refreshTtlSec}`
    );

    return c.json({ accessToken: access });
});

// logout (revoke current RT)
authRoute.post('/logout', async (c) => {
    const rt = getCookie(c, security.cookieName);
    if (!rt) return c.text('No refresh token', 400);

    // verifikasi RT & ambil jti via TokenService (bukan import jose manual)
    const tokens = new TokenService();
    const payload = await tokens.verifyRefreshToken(rt);
    const jti = payload.jti as string;

    const cmd = c.var.container.resolve(LogoutCommand);
    await cmd.execute(jti);

    deleteCookie(c, security.cookieName, {
        path: '/auth',
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
    });
    return c.body(null, 204);
});
