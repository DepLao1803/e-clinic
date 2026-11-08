import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { toApiJson } from '../utils/serialize.util';

/**
 * Every success response becomes { success: true, message?, data } — the envelope the Laravel
 * controllers hand-built with response()->json(). Handlers that already return a `success` key
 * (e.g. paginated helpers) pass through untouched.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const message = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [ctx.getHandler(), ctx.getClass()]);
    return next.handle().pipe(
      map((raw) => {
        const body = toApiJson(raw) as Record<string, unknown> | null;
        if (body && typeof body === 'object' && 'success' in body) return body;
        return { success: true, ...(message ? { message } : {}), data: body ?? null };
      }),
    );
  }
}
