import { BadRequestException, Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationFailed } from '../common/filters/http-exception.filter';
import { decrypt, encrypt } from './crypto.util';

/** Replaces Fortify's two-factor feature (same three user columns, same TOTP standard). */
@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  async setup(userId: number, email: string | null) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encrypt(secret), twoFactorConfirmedAt: null, twoFactorRecoveryCodes: null },
    });
    return { secret, otpauth_url: authenticator.keyuri(email ?? `user-${userId}`, 'e-Clinic', secret) };
  }

  async confirm(userId: number, code: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!u.twoFactorSecret) throw new BadRequestException('Chưa khởi tạo xác thực hai bước.');
    if (!authenticator.check(code, decrypt(u.twoFactorSecret)))
      throw new ValidationFailed({ code: ['Mã xác thực không đúng.'] });
    const plain = Array.from({ length: 8 }, () => randomBytes(5).toString('hex'));
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorConfirmedAt: new Date(),
        twoFactorRecoveryCodes: encrypt(JSON.stringify(await Promise.all(plain.map((c) => bcrypt.hash(c, 8))))),
      },
    });
    return { recovery_codes: plain }; // shown once
  }

  async disable(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorRecoveryCodes: null, twoFactorConfirmedAt: null },
    });
  }

  isEnabled(u: { twoFactorSecret: string | null; twoFactorConfirmedAt: Date | null }) {
    return !!u.twoFactorSecret && !!u.twoFactorConfirmedAt;
  }

  async verify(userId: number, code?: string, recoveryCode?: string): Promise<boolean> {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!u.twoFactorSecret) return false;
    if (code) return authenticator.check(code, decrypt(u.twoFactorSecret));
    if (recoveryCode && u.twoFactorRecoveryCodes) {
      const hashes: string[] = JSON.parse(decrypt(u.twoFactorRecoveryCodes));
      for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(recoveryCode, hashes[i])) {
          hashes.splice(i, 1); // single use
          await this.prisma.user.update({ where: { id: userId }, data: { twoFactorRecoveryCodes: encrypt(JSON.stringify(hashes)) } });
          return true;
        }
      }
    }
    return false;
  }
}
