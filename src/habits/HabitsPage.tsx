import { Archive, ArchiveRestore, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Flame, Pencil, Plus, Sparkles, Trash2, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Drawer } from '../components/ui/Drawer';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Segmented, cx } from '../components/ui/primitives';
import { WEEKDAYS_SHORT, addDays, formatShort, parseISO, startOfWeek } from '../lib/dates';
import { useStore } from '../store/AppStore';
import type { ISODate } from '../types';
import {
  ALL_DAYS,
  HABIT_COLORS,
  HABIT_SUGGESTIONS,
  bestStreak,
  completionRate,
  currentStreak,
  isDone,
  isScheduled,
  useHabits,
  valueOf,
  type Habit,
  type HabitColor,
  type HabitInput,
} from './store';

// ───────── Butonul de bifat (folosit și în „Azi”) ─────────

export function HabitCheck({ habit, date, size = 'md' }: { habit: Habit; date: ISODate; size?: 'sm' | 'md' | 'lg' }) {
  const { habitsData, tapHabit, setHabitValue } = useHabits();
  const { today } = useStore();
  const v = valueOf(habitsData, habit, date);
  const done = v >= habit.goal;
  const scheduled = isScheduled(habit, date);
  const future = date > today;
  const c = HABIT_COLORS[habit.color];
  const dim = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const pct = Math.min(1, v / habit.goal);
  const label = `${habit.name} — ${formatShort(date)}: ${habit.goal > 1 ? `${v}/${habit.goal} ${habit.unit}` : done ? 'făcut' : 'nefăcut'}`;

  return (
    <button
      type="button"
      disabled={future}
      title={habit.goal > 1 ? `${label} (click dreapta = −1)` : label}
      aria-label={label}
      aria-pressed={done}
      onClick={() => tapHabit(habit.id, date)}
      onContextMenu={(e) => {
        if (habit.goal <= 1) return;
        e.preventDefault();
        setHabitValue(habit.id, date, v - 1);
      }}
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-all duration-150 active:scale-90',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-30',
        dim,
        done ? cx(c.bg, 'text-white shadow-sm') : scheduled ? 'bg-slate-100 hover:bg-slate-200' : 'border border-dashed border-slate-200 bg-transparent hover:bg-slate-50',
      )}
      style={!done && v > 0 ? { background: `conic-gradient(${c.hex} ${pct * 360}deg, #e2e8f0 0deg)` } : undefined}
    >
      {!done && v > 0 && <span className="absolute inset-[3px] rounded-full bg-white" />}
      {done ? (
        <Check className={cx('animate-[pop_160ms_ease-out]', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5')} strokeWidth={3} />
      ) : v > 0 ? (
        <span className="relative text-[11px] font-semibold text-ink tabular-nums">{v}</span>
      ) : null}
    </button>
  );
}

// ───────── Heatmap (ultimele ~18 săptămâni) ─────────

function Heatmap({ habit, weeks = 18 }: { habit: Habit; weeks?: number }) {
  const { habitsData } = useHabits();
  const { today } = useStore();
  const start = addDays(startOfWeek(today), -7 * (weeks - 1));
  const hex = HABIT_COLORS[habit.color].hex;
  return (
    <div className="flex gap-[3px] overflow-hidden" aria-hidden>
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} className="flex flex-col gap-[3px]">
          {Array.from({ length: 7 }, (_, d) => {
            const date = addDays(start, w * 7 + d);
            const v = valueOf(habitsData, habit, date);
            const pct = Math.min(1, v / habit.goal);
            const out = date > today || date < habit.createdAt;
            return (
              <div
                key={d}
                title={`${formatShort(date)}${v ? ` · ${habit.goal > 1 ? `${v}/${habit.goal}` : 'făcut'}` : ''}`}
                className={cx('h-[11px] w-[11px] rounded-[3px]', out ? 'bg-slate-50' : v ? '' : isScheduled(habit, date) ? 'bg-slate-100' : 'bg-slate-50')}
                style={v && !out ? { background: hex, opacity: 0.3 + 0.7 * pct } : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ───────── Editare / adăugare ─────────

const EMOJIS = ['✅', '📚', '🧭', '🏃', '💪', '🧘', '💧', '😴', '📵', '✍️', '🌳', '🥗', '🍎', '🚭', '🎸', '🎨', '🧹', '💊', '🙏', '🧠', '💰', '🦷', '☀️', '📖'];
const DAY_PRESETS: { label: string; days: number[] }[] = [
  { label: 'Zilnic', days: ALL_DAYS },
  { label: 'Luni–Vineri', days: [1, 2, 3, 4, 5] },
  { label: 'Weekend', days: [6, 0] },
];
const blank = (): HabitInput => ({ name: '', emoji: '✅', color: 'blue', goal: 1, unit: '', days: ALL_DAYS });

function HabitDrawer({ habitId, open, onClose }: { habitId: string | null; open: boolean; onClose: () => void }) {
  const { habitsData, addHabit, updateHabit, deleteHabit, restoreHabit } = useHabits();
  const { toast, confirm } = useFeedback();
  const existing = habitsData.habits.find((h) => h.id === habitId);
  const [form, setForm] = useState<HabitInput>(blank);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? { name: existing.name, emoji: existing.emoji, color: existing.color, goal: existing.goal, unit: existing.unit, days: existing.days } : blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, habitId]);

  const set = (patch: Partial<HabitInput>) => setForm((f) => ({ ...f, ...patch }));
  const toggleDay = (d: number) => set({ days: form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d] });
  const valid = form.name.trim() && form.days.length > 0;

  const save = () => {
    if (!valid) return;
    if (existing) {
      updateHabit(existing.id, { ...form, name: form.name.trim() });
      toast('Obicei actualizat.');
    } else {
      addHabit(form);
      toast(`„${form.name.trim()}” adăugat.`);
    }
    onClose();
  };

  const onDelete = async () => {
    if (!existing) return;
    if (!(await confirm({ title: `Ștergi „${existing.name}”?`, text: 'Dispare cu tot cu istoric. Dacă vrei doar să-l oprești, arhivează-l.', confirmLabel: 'Șterge', danger: true }))) return;
    const h = deleteHabit(existing.id);
    onClose();
    if (h) toast('Obicei șters.', 'info', { label: 'Anulează', onClick: () => restoreHabit(h) });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={existing ? 'Editează obiceiul' : 'Obicei nou'}
      footer={
        <div className="flex items-center justify-between gap-2">
          {existing ? (
            <div className="flex gap-2">
              <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete}>
                Șterge
              </Button>
              <Button
                size="sm"
                icon={existing.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                onClick={() => {
                  updateHabit(existing.id, { archived: !existing.archived });
                  toast(existing.archived ? 'Obicei reactivat.' : 'Obicei arhivat — istoricul rămâne.', 'info');
                  onClose();
                }}
              >
                {existing.archived ? 'Reactivează' : 'Arhivează'}
              </Button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>Anulează</Button>
            <Button variant="primary" onClick={save} disabled={!valid}>
              {existing ? 'Salvează' : 'Adaugă'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {!existing && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Idei rapide
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_SUGGESTIONS.map((s) => (
                <button key={s.name} type="button" onClick={() => setForm({ ...s })} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink hover:border-accent hover:bg-accent-soft/40">
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl', HABIT_COLORS[form.color].soft)}>{form.emoji}</div>
          <Field label="Nume" className="flex-1">
            <Input autoFocus value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="ex. Citit 20 de minute" onKeyDown={(e) => e.key === 'Enter' && save()} />
          </Field>
        </div>

        <Field label="Iconiță">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => set({ emoji: e })} className={cx('flex h-9 items-center justify-center rounded-lg text-lg transition-colors', form.emoji === e ? 'bg-accent-soft ring-1 ring-accent/40' : 'hover:bg-slate-100')}>
                {e}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Culoare">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(HABIT_COLORS) as HabitColor[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-label={k}
                onClick={() => set({ color: k })}
                className={cx('h-7 w-7 rounded-full transition-transform', HABIT_COLORS[k].bg, form.color === k ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105')}
              />
            ))}
          </div>
        </Field>

        <Field label="Cum îl măsori?">
          <Segmented
            value={form.goal > 1 ? 'count' : 'check'}
            onChange={(v) => set(v === 'check' ? { goal: 1, unit: '' } : { goal: Math.max(2, form.goal), unit: form.unit || 'ori' })}
            options={[
              { value: 'check', label: 'Făcut / nefăcut' },
              { value: 'count', label: 'De mai multe ori pe zi' },
            ]}
            className="w-full"
          />
        </Field>
        {form.goal > 1 && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Obiectiv pe zi">
              <Input inputMode="numeric" value={form.goal} onChange={(e) => set({ goal: Math.max(2, Math.min(100, parseInt(e.target.value, 10) || 2)) })} />
            </Field>
            <Field label="Unitate">
              <Input value={form.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="pahare, pagini…" />
            </Field>
          </div>
        )}

        <Field label="În ce zile?" hint={form.days.length === 0 ? 'Alege cel puțin o zi.' : undefined}>
          <div className="flex gap-1.5">
            {ALL_DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cx('h-9 flex-1 rounded-lg text-[13px] font-medium transition-colors', form.days.includes(d) ? 'bg-accent text-white' : 'bg-slate-100 text-muted hover:text-ink')}
              >
                {WEEKDAYS_SHORT[i]}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {DAY_PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => set({ days: p.days })} className="rounded-md px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent-soft">
                {p.label}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Drawer>
  );
}

// ───────── Pagina ─────────

function HabitCard({ habit, onEdit }: { habit: Habit; onEdit: () => void }) {
  const { habitsData, moveHabit } = useHabits();
  const { today } = useStore();
  const c = HABIT_COLORS[habit.color];
  const streak = currentStreak(habitsData, habit, today);
  const best = bestStreak(habitsData, habit, today);
  const rate = completionRate(habitsData, habit, today, 30);
  return (
    <Card className={cx('!p-4', habit.archived && 'opacity-70')}>
      <div className="flex items-start gap-3">
        <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl', c.soft)}>{habit.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold text-ink">{habit.name}</div>
          <div className="text-xs text-muted">
            {habit.goal > 1 ? `${habit.goal} ${habit.unit} / zi · ` : ''}
            {habit.days.length === 7 ? 'zilnic' : ALL_DAYS.filter((d) => habit.days.includes(d)).map((d) => WEEKDAYS_SHORT[ALL_DAYS.indexOf(d)]).join(' ')}
            {habit.archived && ' · arhivat'}
          </div>
        </div>
        {!habit.archived && <HabitCheck habit={habit} date={today} />}
      </div>
      <div className="mt-4 overflow-x-auto no-scrollbar">
        <Heatmap habit={habit} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 py-2">
          <div className="flex items-center justify-center gap-1 text-[15px] font-semibold text-ink tabular-nums">
            <Flame className={cx('h-4 w-4', streak ? 'text-orange-500' : 'text-slate-300')} />
            {streak}
          </div>
          <div className="text-[11px] text-muted">serie acum</div>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <div className="flex items-center justify-center gap-1 text-[15px] font-semibold text-ink tabular-nums">
            <Trophy className="h-4 w-4 text-amber-500" />
            {best}
          </div>
          <div className="text-[11px] text-muted">record</div>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <div className="text-[15px] font-semibold text-ink tabular-nums">{rate}%</div>
          <div className="text-[11px] text-muted">ultimele 30 zile</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-line pt-2">
        {!habit.archived && (
          <>
            <IconButton label="Mută mai sus" onClick={() => moveHabit(habit.id, -1)}>
              <ChevronUp className="h-4 w-4" />
            </IconButton>
            <IconButton label="Mută mai jos" onClick={() => moveHabit(habit.id, 1)}>
              <ChevronDown className="h-4 w-4" />
            </IconButton>
          </>
        )}
        <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
          Editează
        </Button>
      </div>
    </Card>
  );
}

export function HabitsPage() {
  const { habitsData, active, addHabit } = useHabits();
  const { today } = useStore();
  const { toast } = useFeedback();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [drawer, setDrawer] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [showArchived, setShowArchived] = useState(false);

  const archived = habitsData.habits.filter((h) => h.archived);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dueToday = active.filter((h) => isScheduled(h, today));
  const doneToday = dueToday.filter((h) => isDone(habitsData, h, today)).length;
  const isThisWeek = weekStart === startOfWeek(today);

  const openNew = () => setDrawer({ open: true, id: null });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obiceiuri"
        subtitle={active.length ? `Azi: ${doneToday} din ${dueToday.length} făcute${doneToday === dueToday.length && dueToday.length ? ' — bravo! 🎉' : ''}` : 'Construiește obiceiuri mici, zi de zi.'}
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Obicei nou
          </Button>
        }
      />

      {active.length === 0 ? (
        <Card>
          <EmptyState icon={<Sparkles className="h-5 w-5" />} title="Niciun obicei încă" text="Alege câteva idei de mai jos (le poți modifica oricând) sau creează unul de la zero." />
          <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-2 pb-6">
            {HABIT_SUGGESTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => {
                  addHabit(s);
                  toast(`„${s.name}” adăugat.`);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-accent hover:bg-accent-soft/40"
              >
                <Plus className="h-3.5 w-3.5 text-muted" />
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title={isThisWeek ? 'Săptămâna aceasta' : `Săptămâna ${formatShort(week[0])} – ${formatShort(week[6])}`}
              subtitle="Apasă pe un cerc ca să bifezi. Pentru obiceiurile cu număr, fiecare apăsare adaugă +1."
              action={
                <div className="flex items-center gap-1">
                  <IconButton label="Săptămâna anterioară" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                    <ChevronLeft className="h-4 w-4" />
                  </IconButton>
                  {!isThisWeek && (
                    <Button size="sm" variant="ghost" onClick={() => setWeekStart(startOfWeek(today))}>
                      Azi
                    </Button>
                  )}
                  <IconButton label="Săptămâna următoare" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={isThisWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </IconButton>
                </div>
              }
            />
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[420px] border-separate border-spacing-y-1">
                <thead>
                  <tr>
                    <th className="w-full" />
                    {week.map((d, i) => (
                      <th key={d} className="px-0.5 pb-1 text-center">
                        <div className={cx('mx-auto flex w-9 flex-col items-center rounded-lg py-1 text-[11px] font-medium', d === today ? 'bg-accent-soft text-blue-700' : 'text-muted')}>
                          {WEEKDAYS_SHORT[i]}
                          <span className="text-[13px] font-semibold tabular-nums">{parseISO(d).getDate()}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.map((h) => {
                    const streak = currentStreak(habitsData, h, today);
                    return (
                      <tr key={h.id} className="group">
                        <td className="max-w-0 pr-3">
                          <button type="button" onClick={() => setDrawer({ open: true, id: h.id })} className="flex w-full min-w-0 items-center gap-2 rounded-lg py-1 text-left">
                            <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base', HABIT_COLORS[h.color].soft)}>{h.emoji}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] font-medium text-ink group-hover:text-accent">{h.name}</span>
                              <span className="flex items-center gap-1 text-[11px] text-muted">
                                {streak > 0 ? (
                                  <>
                                    <Flame className="h-3 w-3 text-orange-500" /> {streak} {streak === 1 ? 'zi' : 'zile'}
                                  </>
                                ) : h.goal > 1 ? (
                                  `${h.goal} ${h.unit} / zi`
                                ) : (
                                  'începe o serie'
                                )}
                              </span>
                            </span>
                          </button>
                        </td>
                        {week.map((d) => (
                          <td key={d} className="px-0.5 text-center">
                            <HabitCheck habit={h} date={d} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-ink">Statistici</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {active.map((h) => (
                <HabitCard key={h.id} habit={h} onEdit={() => setDrawer({ open: true, id: h.id })} />
              ))}
            </div>
          </section>
        </>
      )}

      {archived.length > 0 && (
        <section>
          <button type="button" onClick={() => setShowArchived((v) => !v)} className="flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
            <Archive className="h-4 w-4" /> Arhivate ({archived.length})
            {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showArchived && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {archived.map((h) => (
                <HabitCard key={h.id} habit={h} onEdit={() => setDrawer({ open: true, id: h.id })} />
              ))}
            </div>
          )}
        </section>
      )}

      <HabitDrawer open={drawer.open} habitId={drawer.id} onClose={() => setDrawer({ open: false, id: null })} />
    </div>
  );
}
