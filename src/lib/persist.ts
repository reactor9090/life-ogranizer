/**
 * Stare salvată automat în localStorage: debounce, salvare la închidere,
 * sincronizare între taburi și backup automat zilnic (ultimele 7 zile).
 */
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { todayISO } from './dates';

const MAX_BACKUPS = 7;

function read<T>(key: string, init: () => T, normalize: (raw: unknown) => T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return init();
  }
  if (!raw) return init();
  try {
    return normalize(JSON.parse(raw));
  } catch (e) {
    console.error(`Datele „${key}” nu au putut fi citite`, e);
    try {
      localStorage.setItem(`${key}.corrupt.${Date.now()}`, raw);
    } catch {
      /* ignoră */
    }
    return init();
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
  try {
    const bk = `${key}.backups`;
    const list = JSON.parse(localStorage.getItem(bk) ?? '[]');
    const arr = Array.isArray(list) ? list : [];
    const entry = { day: todayISO(), savedAt: new Date().toISOString(), data: value };
    if (arr[0]?.day === entry.day) arr[0] = entry;
    else arr.unshift(entry);
    localStorage.setItem(bk, JSON.stringify(arr.slice(0, MAX_BACKUPS)));
  } catch {
    /* backup-ul e opțional */
  }
  return true;
}

export function usePersisted<T>(
  key: string,
  init: () => T,
  normalize: (raw: unknown) => T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(() => read(key, init, normalize));
  const [error, setError] = useState(false);
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    const h = setTimeout(() => setError(!write(key, state)), 250);
    return () => clearTimeout(h);
  }, [key, state]);

  useEffect(() => {
    const flush = () => write(key, latest.current);
    const onVis = () => document.visibilityState === 'hidden' && flush();
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || !e.newValue) return;
      try {
        setState(normalize(JSON.parse(e.newValue)));
      } catch {
        /* ignoră */
      }
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('storage', onStorage);
    };
    // normalize e o funcție stabilă definită la nivel de modul
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [state, setState, error];
}

export const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
export const str = (v: unknown, def = '') => (typeof v === 'string' ? v : def);

// ───────── Backup complet (toate aplicațiile) ─────────

/** Cheile principale ale tuturor aplicațiilor (fără backup-urile automate). */
const ALL_KEYS = ['bacgeo2027.data.v1', 'lifeorg.library.v1', 'lifeorg.habits.v1', 'lifeorg.journal.v1', 'lifeorg.today.v1'];

export function exportEverything() {
  const out: Record<string, unknown> = { app: 'life-organizer', exportedAt: new Date().toISOString() };
  for (const k of ALL_KEYS) {
    try {
      const v = localStorage.getItem(k);
      if (v) out[k] = JSON.parse(v);
    } catch {
      /* sari peste */
    }
  }
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-organizer-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Citește un backup complet; întoarce cheile găsite. Scrierea se face cu applyEverything. */
export async function readEverything(file: File): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('Fișierul nu este un JSON valid.');
  }
  if (!isObj(parsed) || parsed.app !== 'life-organizer') {
    throw new Error('Acesta nu este un backup complet Life Organizer (folosește importul din fiecare aplicație).');
  }
  const found: Record<string, unknown> = {};
  for (const k of ALL_KEYS) if (k in parsed) found[k] = parsed[k];
  if (!Object.keys(found).length) throw new Error('Backup-ul nu conține date.');
  return found;
}

const PENDING_KEY = 'lifeorg.pendingImport';

/**
 * Importul se aplică după reîncărcare (în main.tsx, înainte să pornească aplicațiile),
 * altfel salvarea automată de la închiderea paginii ar suprascrie datele importate.
 */
export function applyEverything(found: Record<string, unknown>) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(found));
  window.location.reload();
}

export function applyPendingImport() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    localStorage.removeItem(PENDING_KEY);
    const found = JSON.parse(raw) as Record<string, unknown>;
    for (const [k, v] of Object.entries(found)) if (ALL_KEYS.includes(k)) localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error('Importul nu a putut fi aplicat', e);
  }
}
