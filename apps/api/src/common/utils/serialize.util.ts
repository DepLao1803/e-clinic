import { Prisma } from '@prisma/client';

const DATE_ONLY = new Set(['appointment_date', 'working_date', 'date', 'date_of_birth', 'issue_date']);
const TIME_ONLY = new Set(['start_at', 'end_at']);
const SECRET = new Set(['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes']);

const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/**
 * Prisma speaks camelCase; the Laravel API (and therefore the Next.js frontend) speaks snake_case.
 * This keeps the public JSON contract byte-compatible without renaming anything in the DB or the schema.
 * It also formats @db.Date / @db.Time values the way Laravel did and strips secret columns.
 */
export function toApiJson(value: unknown, key = ''): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) {
    if (DATE_ONLY.has(key)) return value.toISOString().slice(0, 10);
    if (TIME_ONLY.has(key)) return value.toISOString().slice(11, 19);
    return value.toISOString();
  }
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map((v) => toApiJson(v, key));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const sk = snake(k);
      if (SECRET.has(sk)) continue;
      out[sk] = toApiJson(v, sk);
    }
    return out;
  }
  return value;
}
