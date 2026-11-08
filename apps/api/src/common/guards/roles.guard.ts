import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../decorators/current-user.decorator';
import { ROLES_KEY, RoleName } from '../decorators/roles.decorator';

/** Port of CheckAdminRole, generalised to any role list. Runs after JwtAuthGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required?.length) return true;

    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || !required.some((r) => user.roles.includes(r))) {
      throw new ForbiddenException(
        required.length === 1 && required[0] === 'admin'
          ? 'Forbidden. Admin access required.'
          : 'Forbidden. You do not have permission to access this resource.',
      );
    }
    return true;
  }
}
