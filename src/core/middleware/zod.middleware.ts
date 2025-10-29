// zod-middleware.ts — English-only, Zod v4-ready
import { ZodError, type ZodType } from 'zod';
import type { Context, Next } from 'hono';

type Schemas<B = unknown, Q = unknown, P = unknown, H = unknown> = {
    body?: ZodType<B>;
    query?: ZodType<Q>;
    param?: ZodType<P>;
    headers?: ZodType<H>;
};

// Minimal shape for issues (works with Zod v4; keeps some v3 fallbacks)
type Issue = {
    code: string;
    path?: Array<string | number>;
    message?: string;
    expected?: string; // invalid_type
    input?: unknown; // present if parse called with { reportInput: true }
    origin?: string; // too_small/too_big: 'string' | 'array' | ...
    minimum?: number | bigint; // too_small
    maximum?: number | bigint; // too_big
    format?: string; // invalid_format: 'email' | 'url' | ...
    // v3 fallbacks:
    type?: string; // 'string' | 'array' | ...
    validation?: string; // 'email' | 'url' | ...
};

const capitalize = (s: string) =>
    s ? s[0].toUpperCase() + s.slice(1) : s || '';

function normalizeMessage(issue: Issue, fieldName: string): string {
    const L = capitalize(fieldName);

    switch (issue.code) {
        case 'invalid_type': {
            const isRequired = issue.input === undefined; // Zod v4-friendly check
            if (isRequired) return `${L} is required`;
            const expected = issue.expected ?? 'value';
            return `${L} must be a valid ${expected}`;
        }

        case 'too_small': {
            const origin = issue.origin ?? issue.type;
            const min = String(issue.minimum ?? '');
            if (origin === 'string')
                return `${L} must be at least ${min} characters long`;
            if (origin === 'array' || origin === 'set')
                return `${L} must contain at least ${min} items`;
            return `${L} is too small`;
        }

        case 'too_big': {
            const origin = issue.origin ?? issue.type;
            const max = String(issue.maximum ?? '');
            if (origin === 'string')
                return `${L} must be at most ${max} characters long`;
            if (origin === 'array' || origin === 'set')
                return `${L} must contain at most ${max} items`;
            return `${L} is too large`;
        }

        // Zod v4
        case 'invalid_format': {
            if (issue.format === 'email')
                return `${L} must be a valid email address`;
            if (issue.format === 'url') return `${L} must be a valid URL`;
            return `${L} has an invalid format`;
        }

        // Back-compat (Zod v3)
        case 'invalid_string': {
            if (issue.validation === 'email')
                return `${L} must be a valid email address`;
            if (issue.validation === 'url') return `${L} must be a valid URL`;
            return `${L} contains invalid characters`;
        }

        case 'custom':
        default:
            return issue.message || `${L} is invalid`;
    }
}

function buildHttpError(error: ZodError, _c: Context) {
    const issue = (error.issues?.[0] ?? {}) as Issue;
    const firstPath = Array.isArray(issue.path) ? issue.path[0] : undefined;
    const fieldName = typeof firstPath === 'string' ? firstPath : '(root)';

    const message = error.issues?.length
        ? normalizeMessage(issue, fieldName)
        : 'Invalid input.';

    return Object.assign(new Error(message), {
        status: 400,
        expose: true,
        field: fieldName,
        _allIssues: error.issues, // for internal logging
    });
}

export const zodMiddleware =
    <B = unknown, Q = unknown, P = unknown, H = unknown>(
        schemas: Schemas<B, Q, P, H>
    ) =>
    async (c: Context, next: Next) => {
        const z: any = {};

        if (schemas.query) {
            const r = schemas.query.safeParse(c.req.query());
            if (!r.success) throw buildHttpError(r.error, c);
            z.query = r.data;
        }

        if (schemas.param) {
            const r = schemas.param.safeParse(c.req.param());
            if (!r.success) throw buildHttpError(r.error, c);
            z.param = r.data;
        }

        if (schemas.headers) {
            const headers: Record<string, string> = {};
            c.req.raw.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
            const r = schemas.headers.safeParse(headers);
            if (!r.success) throw buildHttpError(r.error, c);
            z.headers = r.data;
        }

        if (schemas.body) {
            const raw = await c.req.json().catch(() => ({}));
            const r = schemas.body.safeParse(
                raw /*, { reportInput: true } — optional */
            );
            if (!r.success) throw buildHttpError(r.error, c);
            z.body = r.data;
        }

        c.set('z', z);
        await next();
    };
