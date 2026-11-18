/**
 * Persistența bibliotecii — cheie separată în localStorage, ca să nu atingă datele BAC.
 */
import { isValidISO, todayISO } from '../lib/dates';
import type { Book, BookStatus, LibraryData } from './types';

export const LIBRARY_KEY = 'lifeorg.library.v1';
const BACKUPS_KEY = 'lifeorg.library.backups.v1';
const MAX_BACKUPS = 7;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const STATUSES: BookStatus[] = ['reading', 'read', 'want', 'dropped'];

export const emptyLibrary = (): LibraryData => ({
  version: 1,
  books: [],
  settings: { yearlyGoal: 12 },
  updatedAt: new Date().toISOString(),
});

/** Procentul citit; datele vechi (pagina curentă) sunt convertite automat. */
function progressFrom(b: Record<string, unknown>): number {
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  if (typeof b.progress === 'number' && Number.isFinite(b.progress)) return clamp(b.progress);
  if (b.status === 'read') return 100;
  const cur = typeof b.currentPage === 'number' ? b.currentPage : 0;
  const pages = typeof b.pages === 'number' ? b.pages : 0;
  return pages > 0 && cur > 0 ? clamp((cur / pages) * 100) : 0;
}

function normalizeBook(b: Record<string, unknown>): Book | null {
  if (typeof b.id !== 'string' || typeof b.title !== 'string') return null;
  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null);
  const now = new Date().toISOString();
  return {
    id: b.id,
    title: b.title,
    author: s(b.author),
    status: STATUSES.includes(b.status as BookStatus) ? (b.status as BookStatus) : 'want',
    pages: n(b.pages),
    progress: progressFrom(b),
    rating: typeof b.rating === 'number' ? Math.max(0, Math.min(5, Math.round(b.rating))) : 0,
    genre: s(b.genre),
    coverUrl: s(b.coverUrl),
    startDate: isValidISO(b.startDate) ? b.startDate : null,
    finishDate: isValidISO(b.finishDate) ? b.finishDate : null,
    favorite: !!b.favorite,
    notes: s(b.notes),
    addedAt: s(b.addedAt) || now,
    updatedAt: s(b.updatedAt) || now,
  };
}

export function normalizeLibrary(raw: unknown): LibraryData {
  if (!isObj(raw) || !Array.isArray(raw.books)) {
    throw new Error('Fișierul nu conține o bibliotecă validă (lipsește lista de cărți).');
  }
  const settings = isObj(raw.settings) ? raw.settings : {};
  const goal = typeof settings.yearlyGoal === 'number' ? Math.max(0, Math.min(500, Math.round(settings.yearlyGoal))) : 12;
  return {
    version: 1,
    books: raw.books.filter(isObj).map(normalizeBook).filter((b): b is Book => !!b),
    settings: { yearlyGoal: goal },
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export function loadLibrary(): LibraryData {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LIBRARY_KEY);
  } catch {
    /* indisponibil */
  }
  if (!raw) return emptyLibrary();
  try {
    return normalizeLibrary(JSON.parse(raw));
  } catch (e) {
    console.error('Biblioteca salvată nu a putut fi citită', e);
    try {
      localStorage.setItem(`${LIBRARY_KEY}.corrupt.${Date.now()}`, raw);
    } catch {
      /* ignoră */
    }
    return emptyLibrary();
  }
}

export function saveLibrary(data: LibraryData): boolean {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(data));
  } catch {
    return false;
  }
  // backup automat zilnic (ultimele 7 zile)
  try {
    const day = todayISO();
    const list = JSON.parse(localStorage.getItem(BACKUPS_KEY) ?? '[]');
    const arr = Array.isArray(list) ? list : [];
    const entry = { day, savedAt: new Date().toISOString(), data };
    if (arr[0]?.day === day) arr[0] = entry;
    else arr.unshift(entry);
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(arr.slice(0, MAX_BACKUPS)));
  } catch {
    /* backup-ul e opțional */
  }
  return true;
}

export function downloadLibrary(data: LibraryData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `biblioteca-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readLibraryFile(file: File): Promise<LibraryData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('Fișierul nu este un JSON valid.');
  }
  return normalizeLibrary(parsed);
}
