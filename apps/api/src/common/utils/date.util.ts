export const APP_TZ = process.env.APP_TZ ?? 'Asia/Ho_Chi_Minh';

/** "Today" in clinic time as YYYY-MM-DD (never use the server's UTC date: a 06:00 VN booking would land on "yesterday"). */
export const todayStr = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: APP_TZ }).format(new Date());

/** 'YYYY-MM-DD' -> Date at UTC midnight, the value Prisma expects for @db.Date columns. */
export const toDateOnly = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

/** Date (from @db.Date) -> 'YYYY-MM-DD' */
export const fromDateOnly = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null);

/** Date (from @db.Time) -> 'HH:mm:ss' (what Laravel returned). */
export const fromTime = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(11, 19) : null);

export const toTime = (hhmm: string): Date => new Date(`1970-01-01T${hhmm.length === 5 ? hhmm + ':00' : hhmm}.000Z`);

export const slugify = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
