import { BookMarked, BookOpen, BookOpenCheck, Download, FileText, Library, Plus, Search, Star, Target, Upload } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, EmptyState, IconButton, Input, ProgressBar, Segmented, Select, cx } from '../components/ui/primitives';
import { BookCover, FavoriteMark, Stars } from './components';
import { AddBookDrawer, BookDetailDrawer } from './BookDrawer';
import { STATUS_META, clampPct, libraryStats, readingPct } from './helpers';
import { useLibrary } from './LibraryStore';
import { downloadLibrary, readLibraryFile } from './storage';
import type { Book, BookStatus } from './types';

type Filter = 'all' | BookStatus | 'favorite';
type Sort = 'recent' | 'title' | 'author' | 'rating' | 'finished';

function Stat({ icon, label, value, sub, tone }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; tone: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className={cx('flex h-7 w-7 items-center justify-center rounded-lg', tone)}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Card>
  );
}

function GoalStat({ done, goal, year, onGoal }: { done: number; goal: number; year: number; onGoal: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const pct = goal ? Math.round((done / goal) * 100) : 0;
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-success">
            <Target className="h-4 w-4" />
          </span>
          Citite în {year}
        </span>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-accent hover:underline">
            {goal ? 'Obiectiv' : 'Setează obiectiv'}
          </button>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{done}</span>
        {goal > 0 && !editing && <span className="text-sm text-muted tabular-nums">/ {goal}</span>}
        {editing && (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            /
            <Input
              autoFocus
              inputMode="numeric"
              defaultValue={goal || ''}
              className="!h-7 w-16 text-center"
              onBlur={(e) => {
                onGoal(Math.max(0, parseInt(e.target.value, 10) || 0));
                setEditing(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
            cărți
          </span>
        )}
      </div>
      {goal > 0 ? (
        <>
          <ProgressBar value={pct} size="sm" tone="success" className="mt-2" />
          <div className="mt-1 text-xs text-muted">{done >= goal ? 'Obiectiv atins! 🎉' : `mai ai ${goal - done} până la obiectiv`}</div>
        </>
      ) : (
        <div className="mt-1 text-xs text-muted">fără obiectiv anual</div>
      )}
    </Card>
  );
}

function ReadingCard({ book }: { book: Book }) {
  const { openBook, updateBook } = useLibrary();
  const pct = readingPct(book);
  return (
    <Card className="!p-3.5">
      <div className="flex gap-3.5">
        <button onClick={() => openBook(book.id)} className="w-[72px] shrink-0 transition-transform hover:-translate-y-0.5">
          <BookCover title={book.title} author={book.author} url={book.coverUrl} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <button onClick={() => openBook(book.id)} className="text-left">
            <div className="line-clamp-2 text-[14.5px] leading-snug font-semibold text-ink hover:text-accent">{book.title}</div>
            <div className="mt-0.5 truncate text-[13px] text-muted">{book.author || 'Autor necunoscut'}</div>
          </button>
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Citit</span>
              <span className="font-semibold text-ink tabular-nums">{pct}%</span>
            </div>
            <ProgressBar value={pct} size="sm" className="mt-1.5" />
            <div className="mt-2.5 flex items-center gap-1.5">
              <Button size="sm" variant="soft" className="!h-7 !px-2 !text-xs" onClick={() => updateBook(book.id, { progress: clampPct(pct + 5) })}>
                +5%
              </Button>
              <Button size="sm" variant="soft" className="!h-7 !px-2 !text-xs" onClick={() => updateBook(book.id, { progress: clampPct(pct + 10) })}>
                +10%
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto !h-7 !px-2 !text-xs" onClick={() => updateBook(book.id, { status: 'read' })}>
                <BookOpenCheck className="h-3.5 w-3.5" /> Terminată
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BookTile({ book }: { book: Book }) {
  const { openBook } = useLibrary();
  const meta = STATUS_META[book.status];
  return (
    <button type="button" onClick={() => openBook(book.id)} className="group flex min-w-0 flex-col text-left focus-visible:outline-none">
      <div className="relative transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 rounded-md">
        <BookCover title={book.title} author={book.author} url={book.coverUrl} className={cx(book.status === 'dropped' && 'opacity-60 grayscale')} />
        <span className={cx('absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold shadow-sm', meta.pill)}>
          <span className={cx('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.short}
        </span>
        {book.favorite && <FavoriteMark className="absolute top-2 right-2" />}
        {book.status === 'reading' && readingPct(book) > 0 ? (
          <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-black/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${readingPct(book)}%` }} />
          </div>
        ) : null}
      </div>
      <div className="mt-2.5 line-clamp-2 text-[13.5px] leading-snug font-semibold text-ink group-hover:text-accent">{book.title}</div>
      <div className="mt-0.5 truncate text-xs text-muted">{book.author || '—'}</div>
      {book.rating > 0 && (
        <div className="mt-1">
          <Stars value={book.rating} size="sm" />
        </div>
      )}
    </button>
  );
}

export function LibraryPage() {
  const { library, updateLibrarySettings, replaceLibrary } = useLibrary();
  const { toast, confirm } = useFeedback();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState<BookStatus | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { books } = library;
  const year = new Date().getFullYear();
  const st = useMemo(() => libraryStats(books, year), [books, year]);
  const reading = useMemo(() => books.filter((b) => b.status === 'reading').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [books]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = books.filter(
      (b) =>
        (filter === 'all' || (filter === 'favorite' ? b.favorite : b.status === filter)) &&
        (!needle || `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(needle)),
    );
    const by: Record<Sort, (a: Book, b: Book) => number> = {
      recent: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      title: (a, b) => a.title.localeCompare(b.title, 'ro'),
      author: (a, b) => a.author.localeCompare(b.author, 'ro') || a.title.localeCompare(b.title, 'ro'),
      rating: (a, b) => b.rating - a.rating || a.title.localeCompare(b.title, 'ro'),
      finished: (a, b) => (b.finishDate ?? '').localeCompare(a.finishDate ?? ''),
    };
    return [...list].sort(by[sort]);
  }, [books, filter, sort, q]);

  const count = (f: Filter) => (f === 'all' ? books.length : f === 'favorite' ? books.filter((b) => b.favorite).length : books.filter((b) => b.status === f).length);
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'Toate', count: count('all') },
    { value: 'reading', label: 'În curs', count: count('reading') },
    { value: 'read', label: 'Citite', count: count('read') },
    { value: 'want', label: 'De citit', count: count('want') },
    { value: 'dropped', label: 'Abandonate', count: count('dropped') },
    { value: 'favorite', label: 'Favorite', count: count('favorite') },
  ];

  const onImport = async (file: File) => {
    try {
      const data = await readLibraryFile(file);
      if (await confirm({ title: 'Imporți această bibliotecă?', text: `Fișierul are ${data.books.length} cărți. Biblioteca actuală (${books.length} cărți) va fi înlocuită.`, confirmLabel: 'Importă', danger: true })) {
        replaceLibrary(data);
        toast('Bibliotecă importată.');
      }
    } catch (e) {
      toast((e as Error).message, 'warn');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca mea"
        subtitle={books.length ? `${st.total} ${st.total === 1 ? 'carte' : 'cărți'} · ${st.read} citite · ${st.want} de citit` : 'Toate cărțile tale, într-un singur loc.'}
        actions={
          <>
            <IconButton label="Exportă biblioteca (JSON)" className="border border-line bg-white" onClick={() => { downloadLibrary(library); toast('Backup descărcat.'); }}>
              <Download className="h-4 w-4" />
            </IconButton>
            <IconButton label="Importă bibliotecă (JSON)" className="border border-line bg-white" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
            </IconButton>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onImport(f); }} />
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding('want')}>
              Adaugă carte
            </Button>
          </>
        }
      />

      {books.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Library className="h-5 w-5" />}
            title="Biblioteca e goală deocamdată"
            text="Adaugă cărțile pe care le-ai citit, pe care le citești acum sau pe care vrei să le citești. Le caut automat cu tot cu copertă."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding('read')}>
                  Am citit o carte
                </Button>
                <Button icon={<BookOpen className="h-4 w-4" />} onClick={() => setAdding('reading')}>
                  Citesc acum
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <GoalStat done={st.readThisYear} goal={library.settings.yearlyGoal} year={year} onGoal={(n) => updateLibrarySettings({ yearlyGoal: n })} />
            <Stat icon={<BookOpen className="h-4 w-4" />} tone="bg-accent-soft text-accent" label="Citesc acum" value={st.reading} sub={st.want ? `${st.want} în lista de așteptare` : 'lista de așteptare e goală'} />
            <Stat icon={<FileText className="h-4 w-4" />} tone="bg-violet-50 text-violet-600" label={`Pagini în ${year}`} value={st.pagesThisYear.toLocaleString('ro-RO')} sub={`${st.read} cărți citite în total`} />
            <Stat
              icon={<Star className="h-4 w-4" />}
              tone="bg-amber-50 text-amber-600"
              label="Nota medie"
              value={st.avgRating ? st.avgRating.toFixed(1) : '—'}
              sub={st.avgRating ? <Stars value={Math.round(st.avgRating)} size="sm" /> : 'notează cărțile cu stele'}
            />
          </div>

          {reading.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <BookMarked className="h-4 w-4 text-accent" /> Citesc acum
                </h2>
                <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAdding('reading')}>
                  Încep o carte
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {reading.map((b) => (
                  <ReadingCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Segmented value={filter} onChange={setFilter} options={filters} />
              <div className="flex gap-2">
                <label className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută în bibliotecă…" className="pl-9" />
                </label>
                <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto" aria-label="Sortare">
                  <option value="recent">Recente</option>
                  <option value="title">Titlu A–Z</option>
                  <option value="author">Autor A–Z</option>
                  <option value="rating">Nota</option>
                  <option value="finished">Data terminării</option>
                </Select>
              </div>
            </div>

            {shown.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {shown.map((b) => (
                  <BookTile key={b.id} book={b} />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState icon={<Search className="h-5 w-5" />} title="Nicio carte aici" text={q ? 'Încearcă alt cuvânt de căutare.' : 'Nu ai cărți în această categorie încă.'} />
              </Card>
            )}
          </section>
        </>
      )}

      <AddBookDrawer open={adding !== null} onClose={() => setAdding(null)} initialStatus={adding ?? 'want'} />
      <BookDetailDrawer />
    </div>
  );
}
