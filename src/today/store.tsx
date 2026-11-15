import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { isValidISO, todayISO } from '../lib/dates';
import { uid } from '../lib/ids';
import { isObj, str, usePersisted } from '../lib/persist';
import type { ISODate } from '../types';

export interface Priority {
  text: string;
  done: boolean;
}

export interface Todo {
  id: string;
  text: string;
  date: ISODate;
  done: boolean;
  doneDate: ISODate | null;
}

export interface TodayData {
  version: 1;
  /** Top 3 priorități, pe zile. */
  priorities: Record<ISODate, Priority[]>;
  todos: Todo[];
}

export const PRIORITY_SLOTS = 3;

const KEY = 'lifeorg.today.v1';
const empty = (): TodayData => ({ version: 1, priorities: {}, todos: [] });

function normalize(raw: unknown): TodayData {
  if (!isObj(raw)) return empty();
  const priorities: TodayData['priorities'] = {};
  if (isObj(raw.priorities)) {
    for (const [d, list] of Object.entries(raw.priorities)) {
      if (!isValidISO(d) || !Array.isArray(list)) continue;
      priorities[d] = list.filter(isObj).slice(0, PRIORITY_SLOTS).map((p) => ({ text: str(p.text), done: !!p.done }));
    }
  }
  const todos = (Array.isArray(raw.todos) ? raw.todos : []).filter(isObj).flatMap((t): Todo[] =>
    typeof t.id === 'string' && typeof t.text === 'string'
      ? [{ id: t.id, text: t.text, date: isValidISO(t.date) ? t.date : todayISO(), done: !!t.done, doneDate: isValidISO(t.doneDate) ? t.doneDate : null }]
      : [],
  );
  return { version: 1, priorities, todos };
}

export function prioritiesFor(data: TodayData, date: ISODate): Priority[] {
  const list = data.priorities[date] ?? [];
  return Array.from({ length: PRIORITY_SLOTS }, (_, i) => list[i] ?? { text: '', done: false });
}

interface TodayStore {
  todayData: TodayData;
  saveError: boolean;
  setPriority: (date: ISODate, index: number, patch: Partial<Priority>) => void;
  addTodo: (text: string, date: ISODate) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, patch: Partial<Todo>) => void;
  deleteTodo: (id: string) => Todo | undefined;
  restoreTodo: (t: Todo) => void;
  /** Mută pe data dată toate sarcinile nefăcute din zilele trecute. */
  moveOverdue: (to: ISODate) => number;
  clearDone: (date: ISODate) => void;
}

const Ctx = createContext<TodayStore | null>(null);

export function TodayProvider({ children }: { children: ReactNode }) {
  const [todayData, setData, saveError] = usePersisted(KEY, empty, normalize);

  const store = useMemo<TodayStore>(
    () => ({
      todayData,
      saveError,
      setPriority: (date, index, patch) =>
        setData((d) => {
          const list = prioritiesFor(d, date).map((p, i) => (i === index ? { ...p, ...patch } : p));
          const priorities = { ...d.priorities, [date]: list };
          if (list.every((p) => !p.text.trim() && !p.done)) delete priorities[date];
          return { ...d, priorities };
        }),
      addTodo: (text, date) => {
        if (!text.trim()) return;
        setData((d) => ({ ...d, todos: [...d.todos, { id: uid('todo'), text: text.trim(), date, done: false, doneDate: null }] }));
      },
      toggleTodo: (id) =>
        setData((d) => ({
          ...d,
          todos: d.todos.map((t) => (t.id === id ? { ...t, done: !t.done, doneDate: t.done ? null : todayISO() } : t)),
        })),
      updateTodo: (id, patch) => setData((d) => ({ ...d, todos: d.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTodo: (id) => {
        const t = todayData.todos.find((x) => x.id === id);
        setData((d) => ({ ...d, todos: d.todos.filter((x) => x.id !== id) }));
        return t;
      },
      restoreTodo: (t) => setData((d) => ({ ...d, todos: [...d.todos.filter((x) => x.id !== t.id), t] })),
      moveOverdue: (to) => {
        const n = todayData.todos.filter((t) => !t.done && t.date < to).length;
        setData((d) => ({ ...d, todos: d.todos.map((t) => (!t.done && t.date < to ? { ...t, date: to } : t)) }));
        return n;
      },
      clearDone: (date) => setData((d) => ({ ...d, todos: d.todos.filter((t) => !(t.done && t.date === date)) })),
    }),
    [todayData, saveError, setData],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useToday(): TodayStore {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToday trebuie folosit în TodayProvider');
  return c;
}
