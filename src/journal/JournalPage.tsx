import { BookHeart, CalendarDays, ChevronLeft, ChevronRight, Flame, NotebookPen, Pin, PinOff, Plus, Search, StickyNote, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Drawer } from '../components/ui/Drawer';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, CardHeader, EmptyState, IconButton, Input, Segmented, cx } from '../components/ui/primitives';
import { addDays, formatDay, formatLong, formatShort, relativeDay } from '../lib/dates';
import { useStore } from '../store/AppStore';
import type { ISODate } from '../types';
import { MOODS, NOTE_COLORS, journalStreak, moodOf, useJournal, wordCount, type Note, type NoteColor } from './store';

const PROMPTS = ['Ce a mers bine azi?', 'Ce am învățat azi?', 'Pentru ce sunt recunoscător?', 'Ce m-a stresat?', 'Ce vreau să fac mâine?'];

// ───────── Selector de stare (folosit și în „Azi”) ─────────

export function MoodPicker({ value, onChange, size = 'md' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Cum a fost ziua">
      {MOODS.map((m) => {
        const on = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={m.label}
            onClick={() => onChange(on ? 0 : m.value)}
            className={cx(
              'flex flex-col items-center justify-center rounded-xl border transition-all',
              size === 'sm' ? 'h-10 w-10 text-xl' : 'h-14 flex-1 gap-0.5 text-2xl sm:w-16 sm:flex-none',
              on ? 'scale-105 border-transparent shadow-sm' : 'border-line bg-white grayscale-[60%] hover:grayscale-0',
            )}
            style={on ? { background: `${m.color}22`, boxShadow: `inset 0 0 0 2px ${m.color}` } : undefined}
          >
            {m.emoji}
            {size === 'md' && <span className="text-[10px] font-medium text-muted">{m.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ───────── Jurnal ─────────

function JournalTab() {
  const { journal, setEntry, deleteEntry } = useJournal();
  const { today } = useStore();
  const { confirm, toast } = useFeedback();
  const [date, setDate] = useState<ISODate>(today);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(15);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const entry = journal.entries[date];
  const text = entry?.text ?? '';
  const streak = journalStreak(journal.entries, today);
  const monthCount = Object.keys(journal.entries).filter((d) => d.startsWith(today.slice(0, 7))).length;

  const all = useMemo(() => Object.values(journal.entries).sort((a, b) => b.date.localeCompare(a.date)), [journal.entries]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? all.filter((e) => e.text.toLowerCase().includes(n)) : all;
  }, [all, q]);

  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));

  const addPrompt = (p: string) => {
    const next = text.trim() ? `${text.replace(/\s+$/, '')}\n\n${p}\n` : `${p}\n`;
    setEntry(date, { text: next });
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(next.length, next.length);
      }
    });
  };

  const onDelete = async () => {
    if (await confirm({ title: `Ștergi intrarea din ${formatShort(date)}?`, text: 'Textul și starea zilei se pierd.', confirmLabel: 'Șterge', danger: true })) {
      deleteEntry(date);
      toast('Intrare ștearsă.', 'info');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="!p-0">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <IconButton label="Ziua anterioară" onClick={() => setDate(addDays(date, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <div className="min-w-0 text-center">
            <div className="truncate text-[15px] font-semibold text-ink">{formatLong(date)}</div>
            <div className="text-xs text-muted">{date === today ? 'azi' : relativeDay(date, today)}</div>
          </div>
          <div className="flex items-center gap-1">
            {date !== today && (
              <Button size="sm" variant="ghost" onClick={() => setDate(today)}>
                Azi
              </Button>
            )}
            <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-ink" title="Alege data">
              <CalendarDays className="h-4 w-4" />
              <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
            <IconButton label="Ziua următoare" onClick={() => setDate(addDays(date, 1))} disabled={date >= today} className="disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div>
            <div className="mb-2 text-[13px] font-medium text-ink">Cum a fost ziua?</div>
            <MoodPicker value={entry?.mood ?? 0} onChange={(mood) => setEntry(date, { mood })} />
          </div>
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setEntry(date, { text: e.target.value })}
            placeholder="Scrie liber… ce s-a întâmplat, ce ai simțit, ce ai învățat."
            className="min-h-[320px] w-full resize-y rounded-xl border border-line bg-white px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-slate-400 focus:border-accent focus:ring-3 focus:ring-accent-soft focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => addPrompt(p)} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-ink">
                + {p}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{wordCount(text)} cuvinte · se salvează automat</span>
            {entry && (
              <button onClick={onDelete} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                <Trash2 className="h-3.5 w-3.5" /> Șterge intrarea
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Starea ta" subtitle="Ultimele 30 de zile" />
          <div className="grid grid-cols-10 gap-1">
            {last30.map((d) => {
              const m = moodOf(journal.entries[d]?.mood ?? 0);
              const has = !!journal.entries[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  title={`${formatShort(d)}${m ? ` · ${m.label}` : has ? ' · scris' : ''}`}
                  className={cx('flex aspect-square items-center justify-center rounded-md text-[11px] transition-transform hover:scale-110', !m && (has ? 'bg-slate-200' : 'bg-slate-100'), d === date && 'ring-2 ring-accent ring-offset-1')}
                  style={m ? { background: m.color } : undefined}
                >
                  {d === today && <span className="h-1 w-1 rounded-full bg-white mix-blend-difference" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
            {MOODS.map((m) => (
              <span key={m.value} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm" style={{ background: m.color }} />
                {m.label}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="flex items-center justify-center gap-1 text-[15px] font-semibold text-ink tabular-nums">
                <Flame className={cx('h-4 w-4', streak ? 'text-orange-500' : 'text-slate-300')} />
                {streak}
              </div>
              <div className="text-[11px] text-muted">zile la rând</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-[15px] font-semibold text-ink tabular-nums">{monthCount}</div>
              <div className="text-[11px] text-muted">zile scrise luna asta</div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Intrări" subtitle={`${all.length} în total`} />
          <label className="relative mb-3 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută în jurnal…" className="pl-9" />
          </label>
          {list.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">{q ? 'Nimic găsit.' : 'Încă nu ai scris nimic.'}</p>
          ) : (
            <div className="-mx-2 space-y-0.5">
              {list.slice(0, limit).map((e) => (
                <button
                  key={e.date}
                  type="button"
                  onClick={() => setDate(e.date)}
                  className={cx('flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors', e.date === date ? 'bg-accent-soft/60' : 'hover:bg-slate-50')}
                >
                  <span className="text-lg leading-none">{moodOf(e.mood)?.emoji ?? '📝'}</span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">{formatDay(e.date)}</span>
                    <span className="line-clamp-2 text-xs text-muted">{e.text.trim() || 'doar starea zilei'}</span>
                  </span>
                </button>
              ))}
              {list.length > limit && (
                <Button size="sm" variant="ghost" className="w-full" onClick={() => setLimit(limit + 30)}>
                  Arată mai multe
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ───────── Notițe ─────────

function NoteDrawer({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const { journal, updateNote, deleteNote, restoreNote } = useJournal();
  const { toast } = useFeedback();
  const note = journal.notes.find((n) => n.id === noteId);

  const close = () => {
    // notițele goale nu se păstrează
    if (note && !note.title.trim() && !note.body.trim()) deleteNote(note.id);
    onClose();
  };
  if (!note) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;

  const remove = () => {
    const n = deleteNote(note.id);
    onClose();
    if (n && (n.title.trim() || n.body.trim())) toast('Notiță ștearsă.', 'info', { label: 'Anulează', onClick: () => restoreNote(n) });
  };

  return (
    <Drawer
      open
      onClose={close}
      title={note.title.trim() || 'Notiță nouă'}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={remove}>
            Șterge
          </Button>
          <Button variant="primary" onClick={close}>
            Gata
          </Button>
        </div>
      }
    >
      <div className="flex h-full flex-col gap-3">
        <input
          autoFocus={!note.title}
          value={note.title}
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          placeholder="Titlu"
          className="w-full bg-transparent text-xl font-semibold text-ink placeholder:text-slate-300 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          {(Object.keys(NOTE_COLORS) as NoteColor[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Culoare ${c}`}
              onClick={() => updateNote(note.id, { color: c })}
              className={cx('h-6 w-6 rounded-full', NOTE_COLORS[c].swatch, note.color === c && 'ring-2 ring-slate-400 ring-offset-2')}
            />
          ))}
          <button
            type="button"
            onClick={() => updateNote(note.id, { pinned: !note.pinned })}
            className={cx('ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', note.pinned ? 'border-accent/30 bg-accent-soft text-blue-700' : 'border-line text-muted hover:text-ink')}
          >
            {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {note.pinned ? 'Desprinde' : 'Fixează sus'}
          </button>
        </div>
        <textarea
          autoFocus={!!note.title}
          value={note.body}
          onChange={(e) => updateNote(note.id, { body: e.target.value })}
          placeholder="Scrie aici… idei, liste, link-uri, orice."
          className={cx('min-h-[50dvh] w-full flex-1 resize-none rounded-xl border p-3.5 text-[14.5px] leading-relaxed text-ink placeholder:text-slate-400 focus:ring-3 focus:ring-accent-soft focus:outline-none', NOTE_COLORS[note.color].card)}
        />
        <p className="text-xs text-muted">Modificată {relativeDay(note.updatedAt.slice(0, 10))} · se salvează automat</p>
      </div>
    </Drawer>
  );
}

function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(
        'mb-3 block w-full break-inside-avoid rounded-xl border p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md',
        NOTE_COLORS[note.color].card,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-[14.5px] font-semibold text-ink">{note.title.trim() || <span className="text-slate-400">Fără titlu</span>}</div>
        {note.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-accent" />}
      </div>
      {note.body.trim() && <p className="mt-1.5 line-clamp-[10] text-[13px] leading-relaxed whitespace-pre-line text-slate-600">{note.body}</p>}
      <div className="mt-3 text-[11px] text-muted">{formatShort(note.updatedAt.slice(0, 10))}</div>
    </button>
  );
}

function NotesTab() {
  const { journal, addNote } = useJournal();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const notes = useMemo(() => {
    const n = q.trim().toLowerCase();
    return journal.notes
      .filter((x) => !n || `${x.title} ${x.body}`.toLowerCase().includes(n))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [journal.notes, q]);
  const pinned = notes.filter((n) => n.pinned);
  const others = notes.filter((n) => !n.pinned);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută în notițe…" className="pl-9" />
        </label>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(addNote())}>
          Notiță nouă
        </Button>
      </div>

      {journal.notes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<StickyNote className="h-5 w-5" />}
            title="Nicio notiță încă"
            text="Notează idei, liste de cumpărături, filme de văzut, orice vrei să nu uiți."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(addNote())}>
                Prima notiță
              </Button>
            }
          />
        </Card>
      ) : notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Nicio notiță nu se potrivește.</p>
      ) : (
        <>
          {pinned.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                <Pin className="h-3.5 w-3.5" /> Fixate
              </h3>
              <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
                {pinned.map((n) => (
                  <NoteCard key={n.id} note={n} onOpen={() => setOpen(n.id)} />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              {pinned.length > 0 && <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Celelalte</h3>}
              <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
                {others.map((n) => (
                  <NoteCard key={n.id} note={n} onOpen={() => setOpen(n.id)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <NoteDrawer noteId={open} onClose={() => setOpen(null)} />
    </div>
  );
}

// ───────── Pagina ─────────

export function JournalPage({ tab: initialTab }: { tab: 'journal' | 'notes' }) {
  const { journal } = useJournal();
  const [tab, setTab] = useState(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  const change = (t: 'journal' | 'notes') => {
    setTab(t);
    history.replaceState(null, '', t === 'notes' ? '#/journal/notes' : '#/journal');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tab === 'journal' ? 'Jurnal' : 'Notițe'}
        subtitle={tab === 'journal' ? 'Câteva rânduri pe zi. Peste un an o să-ți mulțumești.' : 'Tot ce vrei să nu uiți, într-un singur loc.'}
        actions={
          <Segmented
            value={tab}
            onChange={change}
            options={[
              { value: 'journal', label: <span className="inline-flex items-center gap-1.5"><BookHeart className="h-3.5 w-3.5" /> Jurnal</span>, count: Object.keys(journal.entries).length },
              { value: 'notes', label: <span className="inline-flex items-center gap-1.5"><NotebookPen className="h-3.5 w-3.5" /> Notițe</span>, count: journal.notes.length },
            ]}
          />
        }
      />
      {tab === 'journal' ? <JournalTab /> : <NotesTab />}
    </div>
  );
}
