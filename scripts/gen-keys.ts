import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';

const { publicKey, privateKey } = await generateKeyPair('Ed25519', {
    extractable: true,
});

const pkcs8 = await exportPKCS8(privateKey); // -----BEGIN PRIVATE KEY----- ...
const spki = await exportSPKI(publicKey); // -----BEGIN PUBLIC KEY----- ...

// simpan sebagai base64 biar enak ditaruh di .env (tanpa newline)
const PRIV_B64 = Buffer.from(pkcs8).toString('base64');
const PUB_B64 = Buffer.from(spki).toString('base64');

console.log('JWT_PRIVATE_KEY_PEM_B64=base64:' + PRIV_B64);
console.log('JWT_PUBLIC_KEY_PEM_B64=base64:' + PUB_B64);
