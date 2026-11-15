import { Heart, Loader2, Search, Trash2, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Drawer } from '../components/ui/Drawer';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Field, Input, ProgressBar, Segmented, Textarea, cx } from '../components/ui/primitives';
import { formatShort } from '../lib/dates';
import { BookCover, Stars } from './components';
import { STATUS_META, STATUS_ORDER, readingPct, searchBooks, type BookSearchResult } from './helpers';
import { useLibrary } from './LibraryStore';
import type { BookStatus } from './types';

const statusOptions = STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].short }));
const toNum = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// ───────── Adăugare carte ─────────

export function AddBookDrawer({ open, onClose, initialStatus = 'want' }: { open: boolean; onClose: () => void; initialStatus?: BookStatus }) {
  const { addBook, openBook } = useLibrary();
  const { toast } = useFeedback();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [status, setStatus] = useState<BookStatus>(initialStatus);
  const [picked, setPicked] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setResults([]);
    setSearchError('');
    setTitle('');
    setAuthor('');
    setPages('');
    setCoverUrl('');
    setPicked(null);
    setStatus(initialStatus);
  }, [open, initialStatus]);

  // căutare automată cu debounce
  useEffect(() => {
    const query = q.trim();
    abort.current?.abort();
    if (query.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    const ctrl = new AbortController();
    abort.current = ctrl;
    setSearching(true);
    setSearchError('');
    const h = setTimeout(async () => {
      try {
        setResults(await searchBooks(query, ctrl.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setSearchError('Căutarea nu a mers (ești offline?). Poți completa manual mai jos.');
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(h);
      ctrl.abort();
    };
  }, [q]);

  const pick = (r: BookSearchResult) => {
    setPicked(r.key);
    setTitle(r.title);
    setAuthor(r.author);
    setPages(r.pages ? String(r.pages) : '');
    setCoverUrl(r.coverUrl);
  };

  const submit = () => {
    if (!title.trim()) return;
    const id = addBook({ title, author, status, pages: toNum(pages), coverUrl: coverUrl.trim() });
    toast(`„${title.trim()}” a fost adăugată în bibliotecă.`, 'success', { label: 'Deschide', onClick: () => openBook(id) });
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Adaugă o carte"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Anulează</Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            Adaugă în bibliotecă
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută după titlu sau autor…" className="pl-9" />
            {searching && <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
          </label>
          <p className="mt-1.5 text-xs text-muted">Alege un rezultat ca să completez automat coperta și numărul de pagini.</p>
          {searchError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
              <WifiOff className="h-3.5 w-3.5" /> {searchError}
            </p>
          )}
          {results.length > 0 && (
            <div className="mt-3 grid max-h-[300px] grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-line p-1">
              {results.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => pick(r)}
                  className={cx(
                    'flex items-center gap-3 rounded-lg p-2 text-left transition-colors',
                    picked === r.key ? 'bg-accent-soft/70 ring-1 ring-accent/30' : 'hover:bg-slate-50',
                  )}
                >
                  <div className="w-10 shrink-0">
                    <BookCover title={r.title} author={r.author} url={r.coverUrl.replace('-L.jpg', '-S.jpg')} small />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-medium text-ink">{r.title}</div>
                    <div className="truncate text-xs text-muted">
                      {[r.author, r.year, r.pages && `${r.pages} pag.`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!searching && !searchError && q.trim().length >= 3 && results.length === 0 && (
            <p className="mt-2 text-xs text-muted">Nu am găsit nimic — completează manual mai jos.</p>
          )}
        </div>

        <div className="flex gap-4 border-t border-line pt-5">
          <div className="w-24 shrink-0">
            <BookCover title={title || 'Titlul cărții'} author={author} url={coverUrl} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <Field label="Titlu">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex. Maitreyi" onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </Field>
            <Field label="Autor">
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ex. Mircea Eliade" />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pagini">
            <Input inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value.replace(/\D/g, ''))} placeholder="—" />
          </Field>
          <Field label="Link copertă" hint="opțional">
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
          </Field>
        </div>

        <Field label="Status">
          <Segmented value={status} onChange={setStatus} options={statusOptions} className="w-full" />
        </Field>
      </div>
    </Drawer>
  );
}

// ───────── Detalii / editare carte ─────────

export function BookDetailDrawer() {
  const { library, editingBookId, openBook, updateBook, deleteBook, restoreBook } = useLibrary();
  const { toast, confirm } = useFeedback();
  const book = library.books.find((b) => b.id === editingBookId);
  const close = () => openBook(null);

  if (!book) return <Drawer open={false} onClose={close} title="">{null}</Drawer>;
  const set = (patch: Parameters<typeof updateBook>[1]) => updateBook(book.id, patch);
  const pct = readingPct(book);

  const onDelete = async () => {
    if (!(await confirm({ title: `Ștergi „${book.title}”?`, text: 'Cartea dispare din bibliotecă. Poți anula imediat după.', confirmLabel: 'Șterge', danger: true }))) return;
    const removed = deleteBook(book.id);
    close();
    if (removed) toast('Carte ștearsă.', 'info', { label: 'Anulează', onClick: () => restoreBook(removed) });
  };

  return (
    <Drawer
      open
      onClose={close}
      title="Detalii carte"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>
            Șterge
          </Button>
          <Button variant="primary" onClick={close}>
            Gata
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-4">
          <div className="w-28 shrink-0">
            <BookCover title={book.title} author={book.author} url={book.coverUrl} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={book.title}
              onChange={(e) => set({ title: e.target.value })}
              aria-label="Titlu"
              className="-mx-1.5 w-full rounded-md px-1.5 py-0.5 text-lg leading-snug font-semibold text-ink hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-accent-soft focus:outline-none"
            />
            <input
              value={book.author}
              onChange={(e) => set({ author: e.target.value })}
              placeholder="Autor"
              aria-label="Autor"
              className="-mx-1.5 w-full rounded-md px-1.5 py-0.5 text-sm text-muted hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-accent-soft focus:outline-none"
            />
            <div className="flex items-center gap-2 pt-1">
              <Stars value={book.rating} onChange={(rating) => set({ rating })} size="lg" />
            </div>
            <button
              type="button"
              onClick={() => set({ favorite: !book.favorite })}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                book.favorite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-line text-muted hover:text-ink',
              )}
            >
              <Heart className={cx('h-3.5 w-3.5', book.favorite && 'fill-rose-500 text-rose-500')} />
              {book.favorite ? 'Favorită' : 'Marchează favorită'}
            </button>
          </div>
        </div>

        <Field label="Status">
          <Segmented value={book.status} onChange={(status) => set({ status })} options={statusOptions} className="w-full" />
        </Field>

        {(book.status === 'reading' || book.status === 'dropped') && (
          <div className="rounded-xl border border-line bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-ink">Progres lectură</span>
              <span className="text-muted tabular-nums">{book.pages ? `${pct}%` : 'adaugă nr. de pagini'}</span>
            </div>
            <ProgressBar value={pct} className="mt-2" />
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-muted">Am ajuns la pagina</span>
              <Input
                inputMode="numeric"
                value={book.currentPage || ''}
                onChange={(e) => {
                  const n = toNum(e.target.value) ?? 0;
                  set({ currentPage: book.pages ? Math.min(n, book.pages) : n });
                }}
                className="!h-8 w-20 text-center tabular-nums"
              />
              {book.pages && <span className="text-muted">din {book.pages}</span>}
            </div>
            {book.status === 'reading' && book.pages && book.currentPage >= book.pages && (
              <Button size="sm" variant="soft" className="mt-3" onClick={() => set({ status: 'read' })}>
                Am terminat-o 🎉
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pagini">
            <Input inputMode="numeric" value={book.pages ?? ''} onChange={(e) => set({ pages: toNum(e.target.value) })} placeholder="—" />
          </Field>
          <Field label="Gen">
            <Input value={book.genre} onChange={(e) => set({ genre: e.target.value })} placeholder="ex. roman, SF" />
          </Field>
          {book.status !== 'want' && (
            <Field label="Început">
              <Input type="date" value={book.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value || null })} />
            </Field>
          )}
          {book.status === 'read' && (
            <Field label="Terminat">
              <Input type="date" value={book.finishDate ?? ''} onChange={(e) => set({ finishDate: e.target.value || null })} />
            </Field>
          )}
        </div>

        <Field label="Notițe / impresii">
          <Textarea value={book.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Ce ți-a plăcut, citate, idei…" className="min-h-28" />
        </Field>

        <Field label="Link copertă" hint="Lasă gol pentru o copertă generată automat.">
          <Input value={book.coverUrl} onChange={(e) => set({ coverUrl: e.target.value })} placeholder="https://…" />
        </Field>

        <p className="text-xs text-muted">Adăugată pe {formatShort(book.addedAt.slice(0, 10))}. Modificările se salvează automat.</p>
      </div>
    </Drawer>
  );
}
