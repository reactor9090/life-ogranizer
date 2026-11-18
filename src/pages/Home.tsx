import { ArrowUpRight, Download, Plus, Upload } from 'lucide-react';
import { useMemo, useRef, type ReactNode } from 'react';
import { APPS, type AppMeta } from '../apps';
import { useFeedback } from '../components/ui/Feedback';
import { Button, ProgressBar, ProgressRing, cx } from '../components/ui/primitives';
import { openApp } from '../hooks/useRoute';
import { addDays, diffDays, formatLong } from '../lib/dates';
import { applyEverything, exportEverything, readEverything } from '../lib/persist';
import { countsForProgress, progressOf } from '../lib/progress';
import { journalStreak, moodOf, useJournal } from '../journal/store';
import { BookCover } from '../library/components';
import { libraryStats, readingPct } from '../library/helpers';
import { useLibrary } from '../library/LibraryStore';
import { useStore } from '../store/AppStore';
import { prioritiesFor, useToday } from '../today/store';
import { useDaySummary } from '../today/summary';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Noapte bună';
  if (h < 12) return 'Bună dimineața';
  if (h < 18) return 'Bună ziua';
  return 'Bună seara';
}

function AppTile({ app, children, className }: { app: AppMeta; children: ReactNode; className?: string }) {
  const Icon = app.icon;
  return (
    <button
      type="button"
      onClick={() => openApp(app.id)}
      className={cx(
        'group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-line bg-card p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    >
      <div className={cx('pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-60 blur-3xl transition-opacity group-hover:opacity-90', app.glow)} />
      <div className="relative flex items-start justify-between">
        <div className={cx('flex h-11 w-11 items-center justify-center rounded-xl', app.solid)}>
          <Icon className="h-5.5 w-5.5" />
        </div>
        <ArrowUpRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
      </div>
      <div className="relative mt-4">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">{app.name}</h2>
        <p className="mt-0.5 text-[13px] text-muted">{app.tagline}</p>
      </div>
      <div className="relative mt-auto w-full pt-5">{children}</div>
    </button>
  );
}

const Dashed = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-[13px] text-muted">
    <Plus className="h-4 w-4" /> {children}
  </div>
);

function TodaySummary() {
  const s = useDaySummary();
  const { todayData } = useToday();
  const { today } = useStore();
  const next = prioritiesFor(todayData, today).find((p) => p.text.trim() && !p.done);
  if (!s.total) return <Dashed>Setează prioritățile zilei</Dashed>;
  return (
    <div className="space-y-3">
      {next && (
        <div className="text-[13px]">
          <div className="text-muted">Următoarea prioritate</div>
          <div className="truncate font-medium text-ink">{next.text}</div>
        </div>
      )}
      <div>
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-muted">Progresul zilei</span>
          <span className="font-semibold text-ink tabular-nums">
            {s.done}
            <span className="font-normal text-muted"> / {s.total}</span>
          </span>
        </div>
        <ProgressBar value={s.pct} size="sm" className="mt-1.5" />
      </div>
    </div>
  );
}

function GeoSummary() {
  const { data, today } = useStore();
  const p = useMemo(() => progressOf(data.tasks.filter(countsForProgress)), [data.tasks]);
  const days = Math.max(0, diffDays(today, data.settings.examDate));
  const todayLeft = data.tasks.filter((t) => t.plannedDate === today && t.status !== 'completed').length;
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <ProgressRing value={p.pct} size={64} stroke={6} />
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink tabular-nums">{p.pct}%</span>
      </div>
      <div className="space-y-1 text-[13px]">
        <div>
          <span className="font-semibold text-ink tabular-nums">{days}</span> <span className="text-muted">zile până la BAC</span>
        </div>
        <div>
          <span className="font-semibold text-ink tabular-nums">{todayLeft}</span> <span className="text-muted">{todayLeft === 1 ? 'temă azi' : 'teme azi'}</span>
        </div>
        <div className="text-muted">
          {p.done}/{p.total} teme completate
        </div>
      </div>
    </div>
  );
}

function JournalSummary() {
  const { journal } = useJournal();
  const { today } = useStore();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const wrote = !!journal.entries[today];
  const streak = journalStreak(journal.entries, today);
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {week.map((d) => {
          const e = journal.entries[d];
          const m = moodOf(e?.mood ?? 0);
          return (
            <span key={d} className={cx('flex h-8 flex-1 items-center justify-center rounded-lg text-base', e ? 'bg-amber-50' : 'bg-slate-100', d === today && 'ring-1 ring-amber-300')}>
              {m?.emoji ?? (e ? '📝' : '')}
            </span>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className={wrote ? 'font-medium text-success' : 'text-muted'}>{wrote ? '✓ Ai scris azi' : 'Încă nu ai scris azi'}</span>
        <span className="text-muted">
          {streak > 0 ? `${streak} zile la rând · ` : ''}
          {journal.notes.length} notițe
        </span>
      </div>
    </div>
  );
}

function LibrarySummary() {
  const { library } = useLibrary();
  const year = new Date().getFullYear();
  const st = libraryStats(library.books, year);
  const reading = library.books.filter((b) => b.status === 'reading').slice(0, 3);
  const goal = library.settings.yearlyGoal;
  if (!library.books.length) return <Dashed>Adaugă prima ta carte</Dashed>;
  return (
    <div className="space-y-3">
      {reading.length > 0 ? (
        <div className="flex items-end gap-3">
          <div className="flex -space-x-3">
            {reading.map((b, i) => (
              <div key={b.id} className="w-11 rounded-md ring-2 ring-white" style={{ zIndex: 3 - i, transform: `rotate(${(i - 1) * 4}deg)` }}>
                <BookCover title={b.title} author={b.author} url={b.coverUrl} small />
              </div>
            ))}
          </div>
          <div className="min-w-0 pb-0.5 text-[13px]">
            <div className="text-muted">Citesc acum</div>
            <div className="truncate font-medium text-ink">{reading[0].title}</div>
            <div className="text-xs text-muted tabular-nums">{readingPct(reading[0])}% citit</div>
          </div>
        </div>
      ) : (
        <div className="text-[13px] text-muted">Nicio carte în curs acum.</div>
      )}
      <div>
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-muted">Citite în {year}</span>
          <span className="font-semibold text-ink tabular-nums">
            {st.readThisYear}
            {goal ? <span className="font-normal text-muted"> / {goal}</span> : null}
          </span>
        </div>
        {goal > 0 && <ProgressBar value={(st.readThisYear / goal) * 100} size="sm" tone="success" className="mt-1.5" />}
      </div>
    </div>
  );
}

const SUMMARIES: Record<AppMeta['id'], () => JSX.Element> = {
  today: TodaySummary,
  geo: GeoSummary,
  journal: JournalSummary,
  library: LibrarySummary,
};

export function HomePage() {
  const { today } = useStore();
  const { toast, confirm } = useFeedback();
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File) => {
    try {
      const found = await readEverything(file);
      const ok = await confirm({
        title: 'Restaurezi backup-ul complet?',
        text: `Conține ${Object.keys(found).length} aplicații. Datele actuale ale acestor aplicații vor fi înlocuite, apoi pagina se reîncarcă.`,
        confirmLabel: 'Restaurează',
        danger: true,
      });
      if (ok) applyEverything(found);
    } catch (e) {
      toast((e as Error).message, 'warn');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] animate-[pageIn_220ms_ease-out] px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted">{formatLong(today)}</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink sm:text-[32px]">{greeting()}!</h1>
          <p className="mt-1 text-sm text-muted">Alege unde vrei să lucrezi azi.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => { exportEverything(); toast('Backup complet descărcat.'); }}>
            Backup complet
          </Button>
          <Button size="sm" variant="ghost" icon={<Upload className="h-3.5 w-3.5" />} onClick={() => fileRef.current?.click()}>
            Restaurează
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onImport(f); }} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => {
          const Summary = SUMMARIES[app.id];
          return (
            <AppTile key={app.id} app={app}>
              <Summary />
            </AppTile>
          );
        })}

        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Plus className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500">Loc pentru următoarea aplicație</p>
          <p className="mt-1 max-w-[220px] text-xs text-slate-400">Buget, sport, filme… le poți adăuga oricând.</p>
        </div>
      </div>
    </div>
  );
}
