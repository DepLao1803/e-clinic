import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// Laravel encrypts two_factor_secret with APP_KEY; we do the same with AES-256-GCM and ENCRYPTION_KEY.
const key = () => createHash('sha256').update(process.env.ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? '').digest();

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
