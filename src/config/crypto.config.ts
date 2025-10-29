export const cryptoKeys = {
    ed25519Private: Bun.env.JWT_PRIVATE_KEY!, // base64
    ed25519Public: Bun.env.JWT_PUBLIC_KEY!, // base64
};

export function b64ToUint8Array(b64: string) {
    const clean = b64.startsWith('base64:') ? b64.slice(7) : b64;
    return new Uint8Array(Buffer.from(clean, 'base64'));
}
