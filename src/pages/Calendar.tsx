import { CalendarCheck2, ChevronLeft, ChevronRight, ClipboardCheck, Flag, GraduationCap, Plus, Redo2, Repeat2 } from 'lucide-react';
import { useMemo, useState, type DragEvent } from 'react';
import { MONTH_PLAN } from '../data/monthPlan';
import {
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  formatDay,
  formatLong,
  formatMinutes,
  formatMonth,
  formatShort,
  monthEnd,
  monthOf,
  monthStart,
  startOfWeek,
} from '../lib/dates';
import { TYPE_LABEL, TYPE_STYLE } from '../lib/labels';
import { groupBy, isLate, isOverdue } from '../lib/progress';
import { nextFreeDay } from '../lib/scheduler';
import { useStore } from '../store/AppStore';
import type { ISODate, Task } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { AddTaskForm } from '../components/tasks/AddTaskForm';
import { TaskRow } from '../components/tasks/TaskRow';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, Checkbox, IconButton, Segmented, cx } from '../components/ui/primitives';

type View = 'month' | 'week';
const DND = 'application/x-bacgeo-task';

interface DayInfo {
  tasks: Task[];
  deadlines: Task[];
  revisions: { id: string; title: string; done: boolean }[];
  sims: { id: string; label: string; score: number | null }[];
}

export function CalendarPage() {
  const { data, today, moveTask, rescheduleOverdue, openTask } = useStore();
  const { toast } = useFeedback();
  const [view, setView] = useState<View>('month');
  const [anchor, setAnchor] = useState<ISODate>(today);
  const [selected, setSelected] = useState<ISODate>(today);
  const [dragOver, setDragOver] = useState<ISODate | null>(null);

  const index = useMemo(() => {
    const byDate = groupBy(
      data.tasks.filter((t) => t.plannedDate),
      (t) => t.plannedDate!,
    );
    const byDeadline = groupBy(
      data.tasks.filter((t) => t.deadline && t.status !== 'completed' && t.deadline !== t.plannedDate),
      (t) => t.deadline!,
    );
    const revs = new Map<ISODate, DayInfo['revisions']>();
    for (const r of data.revisions)
      for (const s of r.steps) {
        const arr = revs.get(s.dueDate) ?? [];
        arr.push({ id: r.id, title: r.title, done: !!s.doneDate });
        revs.set(s.dueDate, arr);
      }
    const sims = groupBy(data.simulations, (s) => s.date);
    return (d: ISODate): DayInfo => ({
      tasks: (byDate.get(d) ?? []).sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || a.order - b.order),
      deadlines: byDeadline.get(d) ?? [],
      revisions: revs.get(d) ?? [],
      sims: (sims.get(d) ?? []).map((s) => ({ id: s.id, label: s.label || `BAC ${s.year}`, score: s.score })),
    });
  }, [data.tasks, data.revisions, data.simulations]);

  const lateCount = data.tasks.filter((t) => isLate(t, today)).length;

  const days = useMemo(() => {
    if (view === 'week') {
      const s = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, i) => addDays(s, i));
    }
    const mk = monthOf(anchor);
    const start = startOfWeek(monthStart(mk));
    const end = addDays(startOfWeek(monthEnd(mk)), 6);
    const out: ISODate[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [view, anchor]);

  const shift = (n: number) => {
    const next = view === 'month' ? `${addMonths(monthOf(anchor), n)}-01` : addDays(anchor, 7 * n);
    setAnchor(next);
  };

  const title =
    view === 'month'
      ? formatMonth(monthOf(anchor))
      : `${formatShort(days[0])} – ${formatShort(days[6])} ${days[6].slice(0, 4)}`;

  const plan = MONTH_PLAN.find((m) => m.month === monthOf(anchor));

  const onDrop = (e: DragEvent, d: ISODate) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData(DND);
    const t = data.tasks.find((x) => x.id === id);
    if (!t || t.plannedDate === d) return;
    const from = t.plannedDate;
    moveTask(id, d);
    setSelected(d);
    toast(`Mutat pe ${formatShort(d)}.`, 'success', { label: 'Anulează', onClick: () => moveTask(id, from) });
  };

  const dropProps = (d: ISODate) => ({
    onDragOver: (e: DragEvent) => {
      if (e.dataTransfer.types.includes(DND)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOver !== d) setDragOver(d);
      }
    },
    onDragLeave: () => setDragOver((x) => (x === d ? null : x)),
    onDrop: (e: DragEvent) => onDrop(e, d),
  });

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Trage o temă pe altă zi ca s-o muți. Temele nefinalizate nu se șterg niciodată automat."
        actions={
          lateCount > 0 && (
            <Button
              size="sm"
              variant="primary"
              icon={<Redo2 className="h-4 w-4" />}
              onClick={() => {
                const n = rescheduleOverdue();
                toast(`${n} ${n === 1 ? 'temă reprogramată' : 'teme reprogramate'}.`);
              }}
            >
              Reprogramează restanțele ({lateCount})
            </Button>
          )
        }
      />

      <Card padded={false} className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-1.5">
            <IconButton label="Înapoi" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <IconButton label="Înainte" onClick={() => shift(1)}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
            <h2 className="ml-1 text-[15px] font-semibold text-ink">{title}</h2>
            <Button
              size="sm"
              variant="ghost"
              className="ml-1"
              onClick={() => {
                setAnchor(today);
                setSelected(today);
              }}
            >
              Azi
            </Button>
          </div>
          <Segmented<View>
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'month', label: 'Lună' },
              { value: 'week', label: 'Săptămână' },
            ]}
          />
        </div>

        {view === 'month' && plan && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-slate-50/60 px-4 py-2 text-xs text-muted sm:px-5">
            <span className="font-medium text-ink">Obiectivele lunii:</span>
            {plan.objectives.map((o) => (
              <span key={o} className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-slate-400" />
                {o}
              </span>
            ))}
          </div>
        )}

        {view === 'month' ? (
          <div>
            <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-medium text-muted">
              {WEEKDAYS_SHORT.map((w) => (
                <div key={w} className="py-2">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const info = index(d);
                const inMonth = monthOf(d) === monthOf(anchor);
                const isToday = d === today;
                const isExam = d === data.settings.examDate;
                const isSel = d === selected;
                const shownTasks = info.tasks.slice(0, 3);
                const more = info.tasks.length - shownTasks.length;
                return (
                  <div
                    key={d}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(d)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelected(d)}
                    {...dropProps(d)}
                    className={cx(
                      'relative min-h-[64px] border-r border-b border-slate-100 p-1 text-left transition-colors outline-none sm:min-h-[112px] sm:p-1.5 [&:nth-child(7n)]:border-r-0',
                      !inMonth && 'bg-slate-50/60',
                      isSel && 'bg-accent-soft/30 ring-1 ring-accent/40 ring-inset',
                      dragOver === d && 'bg-accent-soft/60',
                      isExam && 'bg-orange-50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cx(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums',
                          isToday ? 'bg-accent font-semibold text-white' : inMonth ? 'text-ink' : 'text-slate-400',
                        )}
                      >
                        {Number(d.slice(8))}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        {info.deadlines.length > 0 && <Flag className="h-3 w-3 text-amber-500" aria-label="Termene limită" />}
                        {info.revisions.some((r) => !r.done) && <Repeat2 className="h-3 w-3 text-emerald-500" aria-label="Recapitulări" />}
                        {info.sims.length > 0 && <ClipboardCheck className="h-3 w-3 text-amber-600" aria-label="Simulare înregistrată" />}
                      </span>
                    </div>
                    {isExam && (
                      <div className="mt-1 flex items-center gap-1 truncate rounded bg-orange-100 px-1 py-0.5 text-[10px] font-semibold text-orange-700">
                        <GraduationCap className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">EXAMEN BAC</span>
                      </div>
                    )}
                    {/* Pe mobil: puncte */}
                    <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                      {info.tasks.slice(0, 6).map((t) => (
                        <span key={t.id} className={cx('h-1.5 w-1.5 rounded-full', t.status === 'completed' ? 'bg-slate-300' : TYPE_STYLE[t.type].dot)} />
                      ))}
                    </div>
                    {/* Pe desktop: chip-uri */}
                    <div className="mt-1 hidden space-y-0.5 sm:block">
                      {shownTasks.map((t) => (
                        <Chip key={t.id} task={t} today={today} onOpen={() => openTask(t.id)} />
                      ))}
                      {more > 0 && <div className="px-1 text-[11px] font-medium text-muted">+{more} în plus</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-px bg-slate-100 md:grid-cols-7">
            {days.map((d) => {
              const info = index(d);
              const min = info.tasks.filter((t) => t.status !== 'completed').reduce((a, t) => a + t.estimatedMin, 0);
              return (
                <div
                  key={d}
                  {...dropProps(d)}
                  onClick={() => setSelected(d)}
                  className={cx('min-h-[120px] bg-white p-2 md:min-h-[420px]', dragOver === d && 'bg-accent-soft/50', d === selected && 'ring-1 ring-accent/40 ring-inset')}
                >
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <span className={cx('text-xs font-semibold', d === today ? 'text-accent' : 'text-ink')}>{formatDay(d)}</span>
                    {min > 0 && <span className="text-[11px] text-muted">{formatMinutes(min)}</span>}
                  </div>
                  {d === data.settings.examDate && (
                    <div className="mb-1.5 flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">
                      <GraduationCap className="h-3.5 w-3.5" /> Examen BAC
                    </div>
                  )}
                  <div className="space-y-1">
                    {info.tasks.map((t) => (
                      <WeekCard key={t.id} task={t} today={today} />
                    ))}
                    {info.revisions.map((r, i) => (
                      <div key={r.id + i} className={cx('rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800', r.done && 'opacity-50 line-through')}>
                        ↻ {r.title}
                      </div>
                    ))}
                    {info.deadlines.map((t) => (
                      <div key={t.id} className="truncate rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                        ⚑ limită: {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legendă */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5 text-[11px] text-muted sm:px-5">
          {(Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={cx('h-2 w-2 rounded-full', TYPE_STYLE[k].dot)} /> {TYPE_LABEL[k]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <Flag className="h-3 w-3 text-amber-500" /> Termen limită
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Repeat2 className="h-3 w-3 text-emerald-500" /> Recapitulare programată
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClipboardCheck className="h-3 w-3 text-amber-600" /> Simulare înregistrată
          </span>
        </div>
      </Card>

      <DayPanel day={selected} info={index(selected)} />
    </div>
  );
}

function Chip({ task, today, onOpen }: { task: Task; today: ISODate; onOpen: () => void }) {
  const done = task.status === 'completed';
  const overdue = isOverdue(task, today);
  return (
    <div
      draggable={!done}
      onDragStart={(e) => {
        e.dataTransfer.setData(DND, task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      title={task.title}
      className={cx(
        'flex cursor-pointer items-center gap-1 truncate rounded border-l-2 px-1.5 py-0.5 text-[11px] leading-4 transition-colors',
        TYPE_STYLE[task.type].bar,
        done ? 'bg-slate-50 text-slate-400 line-through' : overdue ? 'bg-amber-50 text-amber-900' : 'bg-slate-50 text-ink hover:bg-slate-100',
        !done && 'cursor-grab active:cursor-grabbing',
        task.tag === 'simulation' && !done && 'bg-amber-100 font-medium',
      )}
    >
      <span className="truncate">{task.title}</span>
    </div>
  );
}

function WeekCard({ task, today }: { task: Task; today: ISODate }) {
  const { toggleTask, openTask } = useStore();
  const done = task.status === 'completed';
  return (
    <div
      draggable={!done}
      onDragStart={(e) => {
        e.dataTransfer.setData(DND, task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={cx(
        'flex items-start gap-2 rounded-md border border-l-2 border-slate-100 px-2 py-1.5 text-xs transition-colors',
        TYPE_STYLE[task.type].bar,
        done ? 'bg-slate-50' : isOverdue(task, today) ? 'bg-amber-50' : 'bg-white hover:bg-slate-50',
        !done && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <Checkbox size="sm" checked={done} onChange={() => toggleTask(task.id)} label="Finalizat" className="mt-px" />
      <button onClick={(e) => { e.stopPropagation(); openTask(task.id); }} className={cx('min-w-0 text-left leading-snug', done ? 'text-slate-400 line-through' : 'text-ink')}>
        {task.title}
      </button>
    </div>
  );
}

function DayPanel({ day, info }: { day: ISODate; info: DayInfo }) {
  const { data, today, moveTask } = useStore();
  const { toast } = useFeedback();
  const [adding, setAdding] = useState(false);
  const min = info.tasks.filter((t) => t.status !== 'completed').reduce((a, t) => a + t.estimatedMin, 0);

  const moveTo = (t: Task, d: ISODate) => {
    const from = t.plannedDate;
    moveTask(t.id, d);
    toast(`„${t.title}” mutat pe ${formatShort(d)}.`, 'success', { label: 'Anulează', onClick: () => moveTask(t.id, from) });
  };

  return (
    <Card className="mt-5" padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{formatLong(day)}</h2>
          <p className="text-[13px] text-muted">
            {info.tasks.length ? `${info.tasks.length} teme · ${formatMinutes(min)} rămase` : 'Nicio temă programată'}
            {day === data.settings.examDate && ' · ziua examenului'}
          </p>
        </div>
        <Button size="sm" variant="soft" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding((v) => !v)}>
          Task în această zi
        </Button>
      </div>
      <div className="px-2 pt-2 pb-3 sm:px-3">
        {adding && <AddTaskForm defaultDate={day} onDone={() => setAdding(false)} className="mx-2 mb-2" />}
        <div className="divide-y divide-slate-100">
          {info.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              extra={
                t.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="max-sm:hidden"
                    title="Mută pe următoarea zi de studiu cu loc liber"
                    onClick={() => moveTo(t, nextFreeDay(data.tasks, data.settings, day < today ? today : day, t.id))}
                  >
                    <Redo2 className="h-3.5 w-3.5" /> Amână
                  </Button>
                )
              }
            />
          ))}
        </div>
        {info.revisions.length > 0 && (
          <div className="mx-2.5 mt-3 rounded-lg bg-emerald-50/60 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <Repeat2 className="h-3.5 w-3.5" /> Recapitulări programate
            </div>
            {info.revisions.map((r, i) => (
              <div key={r.id + i} className={cx('text-[13px] text-emerald-900', r.done && 'line-through opacity-60')}>
                {r.title}
              </div>
            ))}
          </div>
        )}
        {info.deadlines.length > 0 && (
          <div className="mx-2.5 mt-3 rounded-lg bg-amber-50/70 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <Flag className="h-3.5 w-3.5" /> Termene limită
            </div>
            {info.deadlines.map((t) => (
              <div key={t.id} className="text-[13px] text-amber-900">
                {t.title} <span className="text-amber-700/70">(planificat {t.plannedDate ? formatShort(t.plannedDate) : '—'})</span>
              </div>
            ))}
          </div>
        )}
        {info.sims.length > 0 && (
          <div className="mx-2.5 mt-3 rounded-lg bg-slate-50 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <CalendarCheck2 className="h-3.5 w-3.5" /> Simulări înregistrate
            </div>
            {info.sims.map((s) => (
              <div key={s.id} className="text-[13px] text-ink">
                {s.label}: {s.score ?? '—'}/100
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
