import { injectable } from 'tsyringe';
import {
    SignJWT,
    jwtVerify,
    importPKCS8,
    importSPKI,
    type JWTPayload,
} from 'jose';
import { security } from '../../../config/security.config';

function fromB64Env(v?: string) {
    if (!v) throw new Error('Missing JWT key env');
    const clean = v.startsWith('base64:') ? v.slice(7) : v;
    return Buffer.from(clean, 'base64').toString('utf8'); // balik ke string PEM
}

const privatePem = fromB64Env(Bun.env.JWT_PRIVATE_KEY);
const publicPem = fromB64Env(Bun.env.JWT_PUBLIC_KEY);

// Algoritma untuk Ed25519 di jose = 'EdDSA'
const privateKey = await importPKCS8(privatePem, 'EdDSA');
const publicKey = await importSPKI(publicPem, 'EdDSA');

export type AccessClaims = { sub: string; role: string; scopes?: string[] };

@injectable()
export class TokenService {
    async signAccessToken(claims: AccessClaims) {
        return await new SignJWT(claims as JWTPayload)
            .setProtectedHeader({ alg: 'EdDSA' })
            .setIssuer(security.issuer)
            .setAudience(security.audience)
            .setExpirationTime(`${security.accessTtlSec}s`)
            .sign(privateKey);
    }

    async signRefreshToken(jti: string, sub: string) {
        return await new SignJWT({ jti, sub })
            .setProtectedHeader({ alg: 'EdDSA' })
            .setIssuer(security.issuer)
            .setAudience(`${security.audience}:refresh`)
            .setExpirationTime(`${security.refreshTtlSec}s`)
            .sign(privateKey);
    }

    async verifyAccessToken(token: string) {
        const { payload } = await jwtVerify(token, publicKey, {
            issuer: security.issuer,
            audience: security.audience,
            clockTolerance: '2s',
        });
        return payload as AccessClaims & JWTPayload;
    }

    async verifyRefreshToken(token: string) {
        const { payload } = await jwtVerify(token, publicKey, {
            issuer: security.issuer,
            audience: `${security.audience}:refresh`,
            clockTolerance: '2s',
        });
        return payload as JWTPayload & { jti: string; sub: string };
    }
}
