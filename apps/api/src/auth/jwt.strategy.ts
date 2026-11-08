import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload { sub: number; type?: 'access' | '2fa' }

/**
 * Like Sanctum, we re-read the user from the DB on *every* request, so a disabled account
 * or a changed role takes effect immediately instead of when the JWT expires.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type === '2fa') throw new UnauthorizedException(); // challenge tokens can't call the API
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      include: { roles: { include: { role: true } }, doctor: { select: { id: true } } },
    });
    if (!user || user.status !== 1) throw new UnauthorizedException('Unauthenticated.');
    return { id: user.id, roles: user.roles.map((r) => r.role.name), doctorId: user.doctor?.id ?? null };
  }
}
