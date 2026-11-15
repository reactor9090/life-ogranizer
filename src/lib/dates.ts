import type { ISODate, MonthKey } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = (): ISODate => toISO(new Date());

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** b − a, în zile. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

export const weekday = (s: ISODate) => parseISO(s).getDay();
export const monthOf = (s: ISODate): MonthKey => s.slice(0, 7);

export function monthStart(mk: MonthKey): ISODate {
  return `${mk}-01`;
}

export function monthEnd(mk: MonthKey): ISODate {
  const [y, m] = mk.split('-').map(Number);
  return toISO(new Date(y, m, 0));
}

export function addMonths(mk: MonthKey, n: number): MonthKey {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Luni ca prima zi a săptămânii. */
export function startOfWeek(s: ISODate): ISODate {
  const wd = weekday(s);
  return addDays(s, wd === 0 ? -6 : 1 - wd);
}

export function isValidISO(s: unknown): s is ISODate {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());
}

// ───────── Formatare în limba română ─────────

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ro-RO', opts);
const fLong = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fShort = fmt({ day: 'numeric', month: 'short' });
const fDay = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const fMonth = fmt({ month: 'long', year: 'numeric' });
const fMonthShort = fmt({ month: 'short' });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatLong = (s: ISODate) => cap(fLong.format(parseISO(s)));
export const formatShort = (s: ISODate) => fShort.format(parseISO(s)).replace('.', '');
export const formatDay = (s: ISODate) => cap(fDay.format(parseISO(s)).replace('.', ''));
export const formatMonth = (mk: MonthKey) => cap(fMonth.format(parseISO(monthStart(mk))));
export const formatMonthShort = (mk: MonthKey) =>
  cap(fMonthShort.format(parseISO(monthStart(mk))).replace('.', ''));

export const WEEKDAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
export const WEEKDAY_NAMES = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

/** Text relativ: „azi”, „mâine”, „ieri”, „în 3 zile”, „acum 2 zile”. */
export function relativeDay(s: ISODate, today: ISODate = todayISO()): string {
  const d = diffDays(today, s);
  if (d === 0) return 'azi';
  if (d === 1) return 'mâine';
  if (d === -1) return 'ieri';
  if (d > 1 && d < 7) return `în ${d} zile`;
  if (d < -1 && d > -7) return `acum ${-d} zile`;
  return formatShort(s);
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
