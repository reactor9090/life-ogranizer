import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { todayISO } from '../lib/dates';
import { uid } from '../lib/ids';
import { LIBRARY_KEY, loadLibrary, normalizeLibrary, saveLibrary } from './storage';
import type { Book, BookStatus, LibraryData, LibrarySettings } from './types';

export type NewBookInput = Pick<Book, 'title' | 'author' | 'status'> &
  Partial<Pick<Book, 'pages' | 'coverUrl' | 'genre' | 'rating' | 'notes'>>;

interface LibraryStore {
  library: LibraryData;
  saveError: boolean;
  addBook: (b: NewBookInput) => string;
  updateBook: (id: string, patch: Partial<Book>) => void;
  setBookStatus: (id: string, status: BookStatus) => void;
  deleteBook: (id: string) => Book | undefined;
  restoreBook: (b: Book) => void;
  updateLibrarySettings: (patch: Partial<LibrarySettings>) => void;
  replaceLibrary: (d: LibraryData) => void;
  // UI
  editingBookId: string | null;
  openBook: (id: string | null) => void;
}

const Ctx = createContext<LibraryStore | null>(null);

/** Completează automat datele când se schimbă statusul. */
function withStatus(b: Book, status: BookStatus): Book {
  const today = todayISO();
  const next: Book = { ...b, status };
  if (status === 'reading' && !b.startDate) next.startDate = today;
  if (status === 'read') {
    next.finishDate = b.finishDate ?? today;
    next.startDate = b.startDate ?? next.finishDate;
    next.progress = 100;
  }
  if (status === 'want') {
    next.startDate = null;
    next.finishDate = null;
    next.progress = 0;
  }
  if (status === 'reading') next.finishDate = null;
  return next;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryData>(loadLibrary);
  const [saveError, setSaveError] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const latest = useRef(library);
  latest.current = library;

  useEffect(() => {
    const h = setTimeout(() => setSaveError(!saveLibrary(library)), 250);
    return () => clearTimeout(h);
  }, [library]);

  useEffect(() => {
    const flush = () => saveLibrary(latest.current);
    const onVis = () => document.visibilityState === 'hidden' && flush();
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LIBRARY_KEY || !e.newValue) return;
      try {
        setLibrary(normalizeLibrary(JSON.parse(e.newValue)));
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
  }, []);

  const store = useMemo<LibraryStore>(() => {
    const mutate = (fn: (d: LibraryData) => LibraryData) =>
      setLibrary((d) => ({ ...fn(d), updatedAt: new Date().toISOString() }));
    const mapBook = (id: string, fn: (b: Book) => Book) =>
      mutate((d) => ({
        ...d,
        books: d.books.map((b) => (b.id === id ? { ...fn(b), updatedAt: new Date().toISOString() } : b)),
      }));

    return {
      library,
      saveError,
      addBook: (input) => {
        const id = uid('book');
        const now = new Date().toISOString();
        const base: Book = {
          id,
          title: input.title.trim(),
          author: input.author.trim(),
          status: 'want',
          pages: input.pages ?? null,
          progress: 0,
          rating: input.rating ?? 0,
          genre: input.genre?.trim() ?? '',
          coverUrl: input.coverUrl ?? '',
          startDate: null,
          finishDate: null,
          favorite: false,
          notes: input.notes ?? '',
          addedAt: now,
          updatedAt: now,
        };
        mutate((d) => ({ ...d, books: [withStatus(base, input.status), ...d.books] }));
        return id;
      },
      updateBook: (id, patch) =>
        mapBook(id, (b) => {
          const next = { ...b, ...patch };
          return patch.status && patch.status !== b.status ? withStatus(next, patch.status) : next;
        }),
      setBookStatus: (id, status) => mapBook(id, (b) => withStatus(b, status)),
      deleteBook: (id) => {
        const b = latest.current.books.find((x) => x.id === id);
        mutate((d) => ({ ...d, books: d.books.filter((x) => x.id !== id) }));
        return b;
      },
      restoreBook: (b) => mutate((d) => ({ ...d, books: [b, ...d.books.filter((x) => x.id !== b.id)] })),
      updateLibrarySettings: (patch) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      replaceLibrary: (d) => setLibrary({ ...d, updatedAt: new Date().toISOString() }),
      editingBookId,
      openBook: setEditingBookId,
    };
  }, [library, saveError, editingBookId]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useLibrary(): LibraryStore {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLibrary trebuie folosit în LibraryProvider');
  return c;
}
