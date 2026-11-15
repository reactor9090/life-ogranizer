import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { addDays, isValidISO, todayISO, weekday } from '../lib/dates';
import { uid } from '../lib/ids';
import { isObj, str, usePersisted } from '../lib/persist';
import type { ISODate } from '../types';

// ───────── Tipuri ─────────

export type HabitColor = 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'teal' | 'orange' | 'slate';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  /** De câte ori pe zi (1 = simplu da/nu). */
  goal: number;
  /** Unitatea pentru goal > 1, ex. „pahare”. */
  unit: string;
  /** Zilele programate: 0 = duminică … 6 = sâmbătă. */
  days: number[];
  archived: boolean;
  createdAt: ISODate;
}

export interface HabitsData {
  version: 1;
  habits: Habit[];
  /** log[data][habitId] = de câte ori a fost făcut în ziua respectivă */
  log: Record<ISODate, Record<string, number>>;
}

export const HABIT_COLORS: Record<HabitColor, { hex: string; bg: string; soft: string; text: string }> = {
  blue: { hex: '#2563eb', bg: 'bg-blue-600', soft: 'bg-blue-50', text: 'text-blue-700' },
  green: { hex: '#16a34a', bg: 'bg-green-600', soft: 'bg-green-50', text: 'text-green-700' },
  amber: { hex: '#d97706', bg: 'bg-amber-500', soft: 'bg-amber-50', text: 'text-amber-700' },
  rose: { hex: '#e11d48', bg: 'bg-rose-600', soft: 'bg-rose-50', text: 'text-rose-700' },
  violet: { hex: '#7c3aed', bg: 'bg-violet-600', soft: 'bg-violet-50', text: 'text-violet-700' },
  teal: { hex: '#0d9488', bg: 'bg-teal-600', soft: 'bg-teal-50', text: 'text-teal-700' },
  orange: { hex: '#ea580c', bg: 'bg-orange-600', soft: 'bg-orange-50', text: 'text-orange-700' },
  slate: { hex: '#475569', bg: 'bg-slate-600', soft: 'bg-slate-100', text: 'text-slate-700' },
};

export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];

export const HABIT_SUGGESTIONS: Omit<Habit, 'id' | 'archived' | 'createdAt'>[] = [
  { name: 'Citit 20 de minute', emoji: '📚', color: 'violet', goal: 1, unit: '', days: ALL_DAYS },
  { name: 'Învățat pentru BAC', emoji: '🧭', color: 'blue', goal: 1, unit: '', days: [1, 2, 3, 4, 5, 6] },
  { name: 'Sport / mișcare', emoji: '🏃', color: 'orange', goal: 1, unit: '', days: [1, 3, 5] },
  { name: 'Apă', emoji: '💧', color: 'teal', goal: 8, unit: 'pahare', days: ALL_DAYS },
  { name: 'Somn înainte de 23:00', emoji: '😴', color: 'slate', goal: 1, unit: '', days: ALL_DAYS },
  { name: 'Fără telefon dimineața', emoji: '📵', color: 'rose', goal: 1, unit: '', days: ALL_DAYS },
  { name: 'Scris în jurnal', emoji: '✍️', color: 'amber', goal: 1, unit: '', days: ALL_DAYS },
  { name: 'Plimbare afară', emoji: '🌳', color: 'green', goal: 1, unit: '', days: ALL_DAYS },
];

// ───────── Calcule ─────────

export const isScheduled = (h: Habit, d: ISODate) => h.days.includes(weekday(d));
export const valueOf = (data: HabitsData, h: Habit, d: ISODate) => data.log[d]?.[h.id] ?? 0;
export const isDone = (data: HabitsData, h: Habit, d: ISODate) => valueOf(data, h, d) >= h.goal;

/** Zile programate la rând făcute, până azi (azi nu rupe seria dacă încă nu e făcut). */
export function currentStreak(data: HabitsData, h: Habit, today: ISODate): number {
  let d = today;
  if (isScheduled(h, d) && !isDone(data, h, d)) d = addDays(d, -1);
  let n = 0;
  for (let i = 0; i < 1500 && d >= h.createdAt; i++, d = addDays(d, -1)) {
    if (!isScheduled(h, d)) continue;
    if (isDone(data, h, d)) n++;
    else break;
  }
  return n;
}

export function bestStreak(data: HabitsData, h: Habit, today: ISODate): number {
  let best = 0;
  let run = 0;
  for (let d = h.createdAt, i = 0; d <= today && i < 1500; d = addDays(d, 1), i++) {
    if (!isScheduled(h, d)) continue;
    if (isDone(data, h, d)) best = Math.max(best, ++run);
    else if (d !== today) run = 0;
  }
  return best;
}

/** % din zilele programate din ultimele `days` zile (de la crearea obiceiului). */
export function completionRate(data: HabitsData, h: Habit, today: ISODate, days = 30): number {
  let total = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (d < h.createdAt) break;
    if (!isScheduled(h, d)) continue;
    if (d === today && !isDone(data, h, d)) continue; // ziua de azi nu e încă ratată
    total++;
    if (isDone(data, h, d)) done++;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

// ───────── Persistență ─────────

const KEY = 'lifeorg.habits.v1';
const empty = (): HabitsData => ({ version: 1, habits: [], log: {} });
const COLORS = Object.keys(HABIT_COLORS) as HabitColor[];

function normalize(raw: unknown): HabitsData {
  if (!isObj(raw)) return empty();
  const habits = (Array.isArray(raw.habits) ? raw.habits : []).filter(isObj).flatMap((h): Habit[] => {
    if (typeof h.id !== 'string' || typeof h.name !== 'string') return [];
    const days = Array.isArray(h.days) ? h.days.filter((x): x is number => typeof x === 'number' && x >= 0 && x <= 6) : ALL_DAYS;
    return [
      {
        id: h.id,
        name: h.name,
        emoji: str(h.emoji, '✅'),
        color: COLORS.includes(h.color as HabitColor) ? (h.color as HabitColor) : 'blue',
        goal: typeof h.goal === 'number' && h.goal >= 1 ? Math.min(100, Math.round(h.goal)) : 1,
        unit: str(h.unit),
        days: days.length ? days : ALL_DAYS,
        archived: !!h.archived,
        createdAt: isValidISO(h.createdAt) ? h.createdAt : todayISO(),
      },
    ];
  });
  const log: HabitsData['log'] = {};
  if (isObj(raw.log)) {
    for (const [d, v] of Object.entries(raw.log)) {
      if (!isValidISO(d) || !isObj(v)) continue;
      const day: Record<string, number> = {};
      for (const [id, n] of Object.entries(v)) if (typeof n === 'number' && n > 0) day[id] = n;
      if (Object.keys(day).length) log[d] = day;
    }
  }
  return { version: 1, habits, log };
}

// ───────── Store ─────────

export type HabitInput = Omit<Habit, 'id' | 'archived' | 'createdAt'>;

interface HabitsStore {
  habitsData: HabitsData;
  saveError: boolean;
  /** Obiceiurile active (nearhivate). */
  active: Habit[];
  addHabit: (h: HabitInput) => string;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => Habit | undefined;
  restoreHabit: (h: Habit) => void;
  moveHabit: (id: string, dir: -1 | 1) => void;
  /** Un „tap”: +1 până la obiectiv, apoi revine la 0. */
  tapHabit: (id: string, date: ISODate) => void;
  setHabitValue: (id: string, date: ISODate, value: number) => void;
}

const Ctx = createContext<HabitsStore | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habitsData, setData, saveError] = usePersisted(KEY, empty, normalize);

  const store = useMemo<HabitsStore>(() => {
    const setValue = (d: HabitsData, id: string, date: ISODate, value: number): HabitsData => {
      const day = { ...(d.log[date] ?? {}) };
      if (value > 0) day[id] = value;
      else delete day[id];
      const log = { ...d.log, [date]: day };
      if (!Object.keys(day).length) delete log[date];
      return { ...d, log };
    };
    return {
      habitsData,
      saveError,
      active: habitsData.habits.filter((h) => !h.archived),
      addHabit: (input) => {
        const id = uid('hab');
        setData((d) => ({
          ...d,
          habits: [...d.habits, { ...input, name: input.name.trim(), id, archived: false, createdAt: todayISO() }],
        }));
        return id;
      },
      updateHabit: (id, patch) => setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) => {
        const h = habitsData.habits.find((x) => x.id === id);
        setData((d) => ({ ...d, habits: d.habits.filter((x) => x.id !== id) }));
        return h;
      },
      restoreHabit: (h) => setData((d) => ({ ...d, habits: [...d.habits.filter((x) => x.id !== h.id), h] })),
      moveHabit: (id, dir) =>
        setData((d) => {
          const list = [...d.habits];
          const i = list.findIndex((h) => h.id === id);
          let j = i + dir;
          while (j >= 0 && j < list.length && list[j].archived) j += dir;
          if (i < 0 || j < 0 || j >= list.length) return d;
          [list[i], list[j]] = [list[j], list[i]];
          return { ...d, habits: list };
        }),
      tapHabit: (id, date) =>
        setData((d) => {
          const h = d.habits.find((x) => x.id === id);
          if (!h) return d;
          const cur = d.log[date]?.[id] ?? 0;
          return setValue(d, id, date, cur >= h.goal ? 0 : cur + 1);
        }),
      setHabitValue: (id, date, value) => setData((d) => setValue(d, id, date, Math.max(0, Math.round(value)))),
    };
  }, [habitsData, saveError, setData]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useHabits(): HabitsStore {
  const c = useContext(Ctx);
  if (!c) throw new Error('useHabits trebuie folosit în HabitsProvider');
  return c;
}
