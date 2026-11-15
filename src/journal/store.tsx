import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { addDays, isValidISO } from '../lib/dates';
import { uid } from '../lib/ids';
import { isObj, str, usePersisted } from '../lib/persist';
import type { ISODate } from '../types';

export interface JournalEntry {
  date: ISODate;
  /** 0 = nesetat, 1–5 */
  mood: number;
  text: string;
  updatedAt: string;
}

export type NoteColor = 'white' | 'yellow' | 'green' | 'blue' | 'pink' | 'violet';

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  color: NoteColor;
  createdAt: string;
  updatedAt: string;
}

export interface JournalData {
  version: 1;
  entries: Record<ISODate, JournalEntry>;
  notes: Note[];
}

export const MOODS: { value: number; emoji: string; label: string; color: string }[] = [
  { value: 1, emoji: '😞', label: 'Foarte rău', color: '#ef4444' },
  { value: 2, emoji: '🙁', label: 'Rău', color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Ok', color: '#94a3b8' },
  { value: 4, emoji: '🙂', label: 'Bine', color: '#84cc16' },
  { value: 5, emoji: '😄', label: 'Super', color: '#16a34a' },
];
export const moodOf = (v: number) => MOODS.find((m) => m.value === v);

export const NOTE_COLORS: Record<NoteColor, { card: string; swatch: string }> = {
  white: { card: 'bg-white border-line', swatch: 'bg-white border border-slate-300' },
  yellow: { card: 'bg-amber-50 border-amber-200', swatch: 'bg-amber-200' },
  green: { card: 'bg-green-50 border-green-200', swatch: 'bg-green-200' },
  blue: { card: 'bg-blue-50 border-blue-200', swatch: 'bg-blue-200' },
  pink: { card: 'bg-rose-50 border-rose-200', swatch: 'bg-rose-200' },
  violet: { card: 'bg-violet-50 border-violet-200', swatch: 'bg-violet-200' },
};

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Zile consecutive cu intrare în jurnal (azi nu rupe seria). */
export function journalStreak(entries: JournalData['entries'], today: ISODate): number {
  const has = (d: ISODate) => !!entries[d] && (entries[d].text.trim() !== '' || entries[d].mood > 0);
  let d = has(today) ? today : addDays(today, -1);
  let n = 0;
  while (has(d) && n < 3000) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// ───────── Persistență ─────────

const KEY = 'lifeorg.journal.v1';
const empty = (): JournalData => ({ version: 1, entries: {}, notes: [] });
const NCOLORS = Object.keys(NOTE_COLORS) as NoteColor[];

function normalize(raw: unknown): JournalData {
  if (!isObj(raw)) return empty();
  const entries: JournalData['entries'] = {};
  if (isObj(raw.entries)) {
    for (const [d, e] of Object.entries(raw.entries)) {
      if (!isValidISO(d) || !isObj(e)) continue;
      const mood = typeof e.mood === 'number' ? Math.max(0, Math.min(5, Math.round(e.mood))) : 0;
      entries[d] = { date: d, mood, text: str(e.text), updatedAt: str(e.updatedAt) || new Date().toISOString() };
    }
  }
  const notes = (Array.isArray(raw.notes) ? raw.notes : []).filter(isObj).flatMap((n): Note[] =>
    typeof n.id === 'string'
      ? [
          {
            id: n.id,
            title: str(n.title),
            body: str(n.body),
            pinned: !!n.pinned,
            color: NCOLORS.includes(n.color as NoteColor) ? (n.color as NoteColor) : 'white',
            createdAt: str(n.createdAt) || new Date().toISOString(),
            updatedAt: str(n.updatedAt) || new Date().toISOString(),
          },
        ]
      : [],
  );
  return { version: 1, entries, notes };
}

// ───────── Store ─────────

interface JournalStore {
  journal: JournalData;
  saveError: boolean;
  setEntry: (date: ISODate, patch: Partial<Pick<JournalEntry, 'mood' | 'text'>>) => void;
  deleteEntry: (date: ISODate) => void;
  addNote: () => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => Note | undefined;
  restoreNote: (n: Note) => void;
}

const Ctx = createContext<JournalStore | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [journal, setJournal, saveError] = usePersisted(KEY, empty, normalize);

  const store = useMemo<JournalStore>(
    () => ({
      journal,
      saveError,
      setEntry: (date, patch) =>
        setJournal((j) => {
          const cur = j.entries[date] ?? { date, mood: 0, text: '', updatedAt: '' };
          const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
          const entries = { ...j.entries, [date]: next };
          if (!next.text.trim() && !next.mood) delete entries[date];
          return { ...j, entries };
        }),
      deleteEntry: (date) =>
        setJournal((j) => {
          const entries = { ...j.entries };
          delete entries[date];
          return { ...j, entries };
        }),
      addNote: () => {
        const id = uid('note');
        const now = new Date().toISOString();
        setJournal((j) => ({ ...j, notes: [{ id, title: '', body: '', pinned: false, color: 'white', createdAt: now, updatedAt: now }, ...j.notes] }));
        return id;
      },
      updateNote: (id, patch) =>
        setJournal((j) => ({ ...j, notes: j.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)) })),
      deleteNote: (id) => {
        const n = journal.notes.find((x) => x.id === id);
        setJournal((j) => ({ ...j, notes: j.notes.filter((x) => x.id !== id) }));
        return n;
      },
      restoreNote: (n) => setJournal((j) => ({ ...j, notes: [n, ...j.notes.filter((x) => x.id !== n.id)] })),
    }),
    [journal, saveError, setJournal],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useJournal(): JournalStore {
  const c = useContext(Ctx);
  if (!c) throw new Error('useJournal trebuie folosit în JournalProvider');
  return c;
}
