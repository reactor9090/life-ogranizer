import { ArrowRight, BookOpen, CalendarClock, Compass, Flame, ListTodo, NotebookPen, PartyPopper, Plus, Sparkles, Star, Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, CardHeader, Checkbox, IconButton, Input, ProgressBar, ProgressRing, cx } from '../components/ui/primitives';
import { HabitCheck } from '../habits/HabitsPage';
import { HABIT_COLORS, currentStreak, isScheduled, useHabits } from '../habits/store';
import { navigate, openApp } from '../hooks/useRoute';
import { formatLong, formatMinutes, relativeDay } from '../lib/dates';
import { MoodPicker } from '../journal/JournalPage';
import { useJournal, wordCount } from '../journal/store';
import { BookCover } from '../library/components';
import { readingPct } from '../library/helpers';
import { useLibrary } from '../library/LibraryStore';
import { useStore } from '../store/AppStore';
import { prioritiesFor, useToday } from './store';
import { useDaySummary } from './summary';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Noapte bună';
  if (h < 12) return 'Bună dimineața';
  if (h < 18) return 'Bună ziua';
  return 'Bună seara';
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick} className="!px-2">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Button>
  );
}

// ───────── Top 3 ─────────

function Priorities() {
  const { todayData, setPriority } = useToday();
  const { today } = useStore();
  const list = prioritiesFor(todayData, today);
  return (
    <Card>
      <CardHeader icon={<Star className="h-4 w-4 text-amber-500" />} title="Top 3 priorități" subtitle="Dacă faci doar astea azi, ziua a fost bună." />
      <div className="space-y-2">
        {list.map((p, i) => (
          <div key={i} className={cx('flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors', p.done ? 'border-green-200 bg-green-50/60' : 'border-line bg-white focus-within:border-accent')}>
            <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', p.done ? 'bg-success text-white' : 'bg-slate-100 text-muted')}>{i + 1}</span>
            <input
              value={p.text}
              onChange={(e) => setPriority(today, i, { text: e.target.value })}
              placeholder={['Cel mai important lucru azi…', 'Al doilea…', 'Al treilea…'][i]}
              className={cx('min-w-0 flex-1 bg-transparent py-1 text-[14.5px] text-ink placeholder:text-slate-400 focus:outline-none', p.done && 'text-muted line-through')}
            />
            {p.text.trim() && <Checkbox checked={p.done} onChange={() => setPriority(today, i, { done: !p.done })} label={p.done ? 'Marchează ca nefăcut' : 'Marchează ca făcut'} />}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ───────── Sarcini ─────────

function Todos() {
  const { todayData, addTodo, toggleTodo, deleteTodo, restoreTodo, moveOverdue, updateTodo, clearDone } = useToday();
  const { today } = useStore();
  const { toast } = useFeedback();
  const [text, setText] = useState('');

  const mine = todayData.todos.filter((t) => t.date === today);
  const open = mine.filter((t) => !t.done);
  const done = mine.filter((t) => t.done);
  const overdue = todayData.todos.filter((t) => !t.done && t.date < today).sort((a, b) => a.date.localeCompare(b.date));

  const submit = () => {
    if (!text.trim()) return;
    addTodo(text, today);
    setText('');
  };
  const remove = (id: string) => {
    const t = deleteTodo(id);
    if (t) toast('Sarcină ștearsă.', 'info', { label: 'Anulează', onClick: () => restoreTodo(t) });
  };

  const row = (t: (typeof mine)[number], extra?: ReactNode) => (
    <div key={t.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <Checkbox checked={t.done} onChange={() => toggleTodo(t.id)} label={t.done ? 'Marchează ca nefăcută' : 'Marchează ca făcută'} />
      <span className={cx('min-w-0 flex-1 text-sm', t.done ? 'text-muted line-through' : 'text-ink')}>{t.text}</span>
      {extra}
      <IconButton label="Șterge" onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100">
        <X className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );

  return (
    <Card>
      <CardHeader
        icon={<ListTodo className="h-4 w-4" />}
        title="De făcut azi"
        subtitle={mine.length ? `${done.length} din ${mine.length} făcute` : 'Lucruri mici: cumpărături, mesaje, treburi.'}
        action={
          done.length > 0 ? (
            <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => clearDone(today)}>
              Curăță
            </Button>
          ) : undefined
        }
      />
      <div className="mb-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Adaugă o sarcină și apasă Enter…" />
        <IconButton label="Adaugă" onClick={submit} className="!h-9 !w-9 border border-line bg-white">
          <Plus className="h-4 w-4" />
        </IconButton>
      </div>

      {overdue.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 p-2">
          <div className="flex items-center justify-between gap-2 px-2 pb-1">
            <span className="text-xs font-semibold text-amber-800">Rămase din zilele trecute ({overdue.length})</span>
            <button
              className="text-xs font-semibold text-accent hover:underline"
              onClick={() => {
                const n = moveOverdue(today);
                toast(`${n} ${n === 1 ? 'sarcină mutată' : 'sarcini mutate'} pe azi.`);
              }}
            >
              Mută toate pe azi
            </button>
          </div>
          {overdue.map((t) =>
            row(
              t,
              <button onClick={() => updateTodo(t.id, { date: today })} className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100">
                {relativeDay(t.date, today)} → azi
              </button>,
            ),
          )}
        </div>
      )}

      {mine.length === 0 && overdue.length === 0 ? (
        <p className="py-3 text-center text-[13px] text-muted">Nicio sarcină pentru azi.</p>
      ) : (
        <div className="-mx-2">
          {open.map((t) => row(t))}
          {done.map((t) => row(t))}
        </div>
      )}
    </Card>
  );
}

// ───────── BAC Geografie ─────────

function GeoToday() {
  const { data, today, toggleTask } = useStore();
  const tasks = data.tasks.filter((t) => t.plannedDate === today).sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || a.order - b.order);
  const minutes = tasks.filter((t) => t.status !== 'completed').reduce((a, t) => a + t.estimatedMin, 0);
  return (
    <Card>
      <CardHeader
        icon={<Compass className="h-4 w-4 text-accent" />}
        title="BAC Geografie"
        subtitle={tasks.length ? `${tasks.filter((t) => t.status === 'completed').length} din ${tasks.length} teme${minutes ? ` · ~${formatMinutes(minutes)} rămase` : ''}` : 'Nicio temă planificată azi.'}
        action={<LinkButton onClick={() => navigate('dashboard')}>Deschide</LinkButton>}
      />
      {tasks.length > 0 ? (
        <div className="-mx-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <Checkbox checked={t.status === 'completed'} onChange={() => toggleTask(t.id)} label={t.title} />
              <span className={cx('min-w-0 flex-1 text-sm', t.status === 'completed' ? 'text-muted line-through' : 'text-ink')}>{t.title}</span>
              <span className="shrink-0 text-xs text-muted tabular-nums">{formatMinutes(t.estimatedMin)}</span>
            </div>
          ))}
        </div>
      ) : (
        <button onClick={() => navigate('calendar')} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-[13px] text-muted hover:border-accent hover:text-ink">
          <CalendarClock className="h-4 w-4" /> Vezi calendarul de studiu
        </button>
      )}
    </Card>
  );
}

// ───────── Obiceiuri ─────────

function HabitsToday() {
  const { active, habitsData } = useHabits();
  const { today } = useStore();
  const list = active.filter((h) => isScheduled(h, today));
  return (
    <Card>
      <CardHeader icon={<Sparkles className="h-4 w-4 text-violet-500" />} title="Obiceiuri" action={<LinkButton onClick={() => openApp('habits')}>Toate</LinkButton>} />
      {list.length === 0 ? (
        <button onClick={() => openApp('habits')} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-[13px] text-muted hover:border-accent hover:text-ink">
          <Plus className="h-4 w-4" /> {active.length ? 'Niciun obicei programat azi' : 'Adaugă primele obiceiuri'}
        </button>
      ) : (
        <div className="space-y-1">
          {list.map((h) => {
            const s = currentStreak(habitsData, h, today);
            const v = habitsData.log[today]?.[h.id] ?? 0;
            return (
              <div key={h.id} className="flex items-center gap-3 rounded-lg py-1">
                <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base', HABIT_COLORS[h.color].soft)}>{h.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{h.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted">
                    {h.goal > 1 && <span className="tabular-nums">{v}/{h.goal} {h.unit}</span>}
                    {h.goal > 1 && s > 0 && '·'}
                    {s > 0 && (
                      <>
                        <Flame className="h-3 w-3 text-orange-500" />
                        {s}
                      </>
                    )}
                  </div>
                </div>
                <HabitCheck habit={h} date={today} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ───────── Jurnal ─────────

function JournalToday() {
  const { journal, setEntry } = useJournal();
  const { today } = useStore();
  const e = journal.entries[today];
  return (
    <Card>
      <CardHeader icon={<NotebookPen className="h-4 w-4 text-amber-600" />} title="Jurnal" subtitle="Cum a fost ziua?" action={<LinkButton onClick={() => openApp('journal')}>Scrie</LinkButton>} />
      <MoodPicker value={e?.mood ?? 0} onChange={(mood) => setEntry(today, { mood })} size="sm" />
      {e?.text.trim() ? (
        <button onClick={() => openApp('journal')} className="mt-3 block w-full rounded-xl bg-slate-50 p-3 text-left hover:bg-slate-100">
          <p className="line-clamp-3 text-[13px] leading-relaxed whitespace-pre-line text-slate-600">{e.text}</p>
          <p className="mt-1 text-[11px] text-muted">{wordCount(e.text)} cuvinte</p>
        </button>
      ) : (
        <button onClick={() => openApp('journal')} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-[13px] text-muted hover:border-accent hover:text-ink">
          <Plus className="h-4 w-4" /> Scrie câteva rânduri despre azi
        </button>
      )}
    </Card>
  );
}

// ───────── Lectură ─────────

function ReadingToday() {
  const { library, updateBook } = useLibrary();
  const book = library.books.filter((b) => b.status === 'reading').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return (
    <Card>
      <CardHeader icon={<BookOpen className="h-4 w-4 text-emerald-600" />} title="Lectură" action={<LinkButton onClick={() => openApp('library')}>Bibliotecă</LinkButton>} />
      {book ? (
        <div className="flex gap-3">
          <div className="w-14 shrink-0">
            <BookCover title={book.title} author={book.author} url={book.coverUrl} small />
          </div>
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-sm font-semibold text-ink">{book.title}</div>
            <div className="truncate text-xs text-muted">{book.author}</div>
            {book.pages ? (
              <>
                <ProgressBar value={readingPct(book)} size="sm" className="mt-2" />
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-muted tabular-nums">
                    p. {book.currentPage}/{book.pages}
                  </span>
                  <Button size="sm" variant="soft" className="!h-7 !px-2 !text-xs" onClick={() => updateBook(book.id, { currentPage: Math.min(book.pages!, book.currentPage + 10) })}>
                    +10 pag.
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <button onClick={() => openApp('library')} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-[13px] text-muted hover:border-accent hover:text-ink">
          <Plus className="h-4 w-4" /> Începe o carte
        </button>
      )}
    </Card>
  );
}

// ───────── Pagina ─────────

export function TodayPage() {
  const { today } = useStore();
  const s = useDaySummary();
  const allDone = s.total > 0 && s.done === s.total;
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">{formatLong(today)}</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">{greeting()}!</h1>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="relative">
            <ProgressRing value={s.pct} size={52} stroke={5} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-ink tabular-nums">{s.pct}%</span>
          </div>
          <div className="text-[13px]">
            <div className="font-semibold text-ink">
              {allDone ? (
                <span className="inline-flex items-center gap-1">
                  Totul gata! <PartyPopper className="h-4 w-4 text-amber-500" />
                </span>
              ) : (
                `${s.done} din ${s.total} făcute`
              )}
            </div>
            <div className="text-muted">priorități · sarcini · obiceiuri · BAC</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="space-y-4">
          <Priorities />
          <Todos />
          <GeoToday />
        </div>
        <div className="space-y-4">
          <HabitsToday />
          <JournalToday />
          <ReadingToday />
        </div>
      </div>
    </div>
  );
}
