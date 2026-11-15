import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Download,
  Hourglass,
  Layers,
  PartyPopper,
  Repeat2,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { CHAPTER_BY_ID, MODULES, MODULE_BY_ID } from '../data/curriculum';
import { MONTH_PLAN } from '../data/monthPlan';
import { diffDays, formatLong, formatMinutes, formatMonthShort, formatShort, monthOf, relativeDay } from '../lib/dates';
import { countsForProgress, isLate, monthProgress, nextUpTask, progressOf, scopeTasks, summarize } from '../lib/progress';
import { downloadJSON } from '../lib/storage';
import { navigate } from '../hooks/useRoute';
import { useStore } from '../store/AppStore';
import { PageHeaderless } from './parts/PageHeaderless';
import { TaskRow } from '../components/tasks/TaskRow';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, CardHeader, EmptyState, IconButton, ProgressBar, ProgressRing, cx } from '../components/ui/primitives';

function Stat({
  icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warn';
}) {
  const iconTone = {
    default: 'bg-slate-100 text-slate-600',
    accent: 'bg-accent-soft text-accent',
    success: 'bg-green-50 text-success',
    warn: 'bg-amber-50 text-amber-600',
  }[tone];
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className={cx('flex h-7 w-7 items-center justify-center rounded-lg', iconTone)}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </Card>
  );
}

export function Dashboard() {
  const { data, today, rescheduleOverdue, openTask } = useStore();
  const { toast } = useFeedback();
  const { tasks, settings } = data;

  const s = useMemo(() => summarize(tasks, today), [tasks, today]);
  const daysLeft = Math.max(0, diffDays(today, settings.examDate));
  const weeksLeft = Math.floor(daysLeft / 7);

  const todays = useMemo(
    () => tasks.filter((t) => t.plannedDate === today).sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || a.order - b.order),
    [tasks, today],
  );
  const late = useMemo(
    () => tasks.filter((t) => isLate(t, today)).sort((a, b) => a.plannedDate!.localeCompare(b.plannedDate!)),
    [tasks, today],
  );
  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'completed' && t.plannedDate && t.plannedDate > today)
        .sort((a, b) => a.plannedDate!.localeCompare(b.plannedDate!) || a.order - b.order)
        .slice(0, 5),
    [tasks, today],
  );
  const next = useMemo(() => nextUpTask(tasks), [tasks]);
  const todayMinutes = todays.filter((t) => t.status !== 'completed').reduce((a, t) => a + t.estimatedMin, 0);
  const todayDone = todays.filter((t) => t.status === 'completed').length;

  const curMonth = monthOf(today);
  const plan = MONTH_PLAN.find((m) => m.month === curMonth) ?? MONTH_PLAN[0];
  const mp = monthProgress(tasks, plan.month);

  const revDue = data.revisions.filter((r) => r.steps.some((x) => !x.doneDate && x.dueDate <= today)).length;
  const lastSim = [...data.simulations].sort((a, b) => b.date.localeCompare(a.date))[0];

  const onReschedule = () => {
    const n = rescheduleOverdue();
    toast(n ? `${n} ${n === 1 ? 'temă reprogramată' : 'teme reprogramate'} pe zilele următoare.` : 'Nu ai teme restante.', n ? 'success' : 'info');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeaderless>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">{formatLong(today)}</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">Salut! Hai să progresăm astăzi.</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Hourglass className="h-4 w-4 text-accent" />
            <span className="font-semibold text-ink tabular-nums">{daysLeft}</span>
            <span className="text-muted">zile până la BAC</span>
          </div>
          <IconButton label="Backup rapid (export JSON)" onClick={() => { downloadJSON(data); toast('Backup descărcat.'); }} className="border border-line bg-white">
            <Download className="h-4 w-4" />
          </IconButton>
          <IconButton label="Setări" onClick={() => navigate('settings')} className="border border-line bg-white">
            <SettingsIcon className="h-4 w-4" />
          </IconButton>
        </div>
      </PageHeaderless>

      {/* Statistici */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat icon={<TrendingUp className="h-4 w-4" />} tone="accent" label="Progres general" value={`${s.overall.pct}%`} sub={`${s.overall.inProgress} în desfășurare`} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} tone="success" label="Teme completate" value={s.overall.done} sub={`din ${s.overall.total} teme`} />
        <Stat icon={<CircleDashed className="h-4 w-4" />} label="Teme rămase" value={s.overall.remaining} sub={s.overdue ? <span className="text-amber-700">{s.overdue} restante</span> : 'nicio restanță'} />
        <Stat icon={<CalendarClock className="h-4 w-4" />} tone="warn" label="Zile până la BAC" value={daysLeft} sub={`${weeksLeft} săptămâni · ${formatShort(settings.examDate)}`} />
        <Stat icon={<Layers className="h-4 w-4" />} label="Capitole finalizate" value={`${s.modulesDone}/${s.modulesTotal}`} sub={`subcapitole: ${s.chaptersDone}/${s.chaptersTotal}`} />
      </div>

      {/* Restanțe */}
      {late.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warn" />
            <span>
              Ai <strong>{late.length}</strong> {late.length === 1 ? 'temă planificată în trecut și nefinalizată' : 'teme planificate în trecut și nefinalizate'}. Nu se șterg — le poți reprograma.
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate('calendar')}>Vezi în calendar</Button>
            <Button size="sm" variant="primary" onClick={onReschedule}>Reprogramează automat</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Today's tasks */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardHeader
              title="Today's Tasks — temele de azi"
              subtitle={
                todays.length
                  ? `${todayDone}/${todays.length} finalizate · ${formatMinutes(todayMinutes)} rămase`
                  : 'Nimic programat pentru azi'
              }
              icon={<BookOpen className="h-4 w-4" />}
              action={
                <Button size="sm" variant="ghost" onClick={() => navigate('calendar')}>
                  Calendar <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              }
            />
            {todays.length > 0 && <ProgressBar value={(todayDone / todays.length) * 100} size="sm" tone="success" className="-mt-1 mb-2" />}
          </div>
          <div className="px-1.5 pb-2 sm:px-2.5">
            {todays.length === 0 ? (
              <EmptyState
                icon={<PartyPopper className="h-5 w-5" />}
                title="Zi liberă de teme noi"
                text={next ? `Poți avansa cu „${next.title}” sau repeta ceva din Revision.` : 'Ai terminat toată materia!'}
                action={next && <Button size="sm" variant="soft" onClick={() => openTask(next.id)}>Deschide următoarea temă</Button>}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {todays.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Continue learning */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Continue Learning" subtitle="Unde ai rămas" icon={<ArrowRight className="h-4 w-4" />} />
            {next ? (
              <ContinueCard taskId={next.id} />
            ) : (
              <p className="text-sm text-muted">Toate temele sunt finalizate. Concentrează-te pe simulări.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Practică și recapitulare" subtitle="Urmărite separat de progres" icon={<Repeat2 className="h-4 w-4" />} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <button onClick={() => navigate('revision')} className="rounded-lg bg-slate-50 p-3 text-left hover:bg-slate-100">
                <div className="text-xs text-muted">Recapitulări azi</div>
                <div className={cx('mt-1 text-lg font-semibold tabular-nums', revDue ? 'text-amber-600' : 'text-ink')}>{revDue}</div>
              </button>
              <button onClick={() => navigate('practice')} className="rounded-lg bg-slate-50 p-3 text-left hover:bg-slate-100">
                <div className="text-xs text-muted">Ultima simulare</div>
                <div className="mt-1 text-lg font-semibold text-ink tabular-nums">
                  {lastSim?.score != null ? `${lastSim.score}/100` : '—'}
                </div>
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Antrenament BAC finalizat</span>
              <span className="tabular-nums">
                {s.practice.done}/{s.practice.total}
              </span>
            </div>
            <ProgressBar value={s.practice.pct} size="sm" className="mt-1.5" tone="warn" />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Progres vizual */}
        <Card className="lg:col-span-2">
          <CardHeader title="Progres pe domenii" subtitle="Calculat după temele finalizate, nu după timp" icon={<Target className="h-4 w-4" />} />
          <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <div className="relative">
              <ProgressRing value={s.overall.pct} size={68} stroke={7} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink tabular-nums">{s.overall.pct}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">Progres general</span>
                <span className="text-muted tabular-nums">
                  {s.overall.done} / {s.overall.total}
                </span>
              </div>
              <ProgressBar value={s.overall.pct} size="lg" className="mt-2" />
              <p className="mt-2 text-xs text-muted">
                Ritm necesar: ~{daysLeft ? Math.ceil(s.overall.remaining / Math.max(1, daysLeft - 45)) : 0} teme/zi ca să termini materia cu 6 săptămâni înainte de examen.
              </p>
            </div>
          </div>
          <div className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {MODULES.filter((m) => m.countsForProgress).map((m) => {
              const p = s.modules.find((x) => x.id === m.id)!.progress;
              return (
                <button key={m.id} onClick={() => navigate('plan')} className="group text-left">
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="truncate text-ink group-hover:text-accent">
                      <span className="mr-1.5 text-muted">{m.code}</span>
                      {m.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {p.done}/{p.total}
                    </span>
                  </div>
                  <ProgressBar value={p.pct} size="sm" className="mt-1.5" />
                </button>
              );
            })}
          </div>
        </Card>

        {/* Upcoming */}
        <Card padded={false}>
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardHeader title="Upcoming" subtitle="Următoarele 5 teme programate" icon={<CalendarClock className="h-4 w-4" />} />
          </div>
          <ul className="px-2 pb-3 sm:px-3">
            {upcoming.map((t) => (
              <li key={t.id}>
                <button onClick={() => openTask(t.id)} className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50">
                  <span className="mt-0.5 w-14 shrink-0 text-xs font-medium text-accent">{relativeDay(t.plannedDate!, today)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{t.title}</span>
                    <span className="block truncate text-xs text-muted">{CHAPTER_BY_ID[t.chapterId]?.title}</span>
                  </span>
                </button>
              </li>
            ))}
            {!upcoming.length && <li className="px-2 py-4 text-sm text-muted">Nicio temă viitoare programată.</li>}
          </ul>
        </Card>
      </div>

      {/* Plan lunar */}
      <Card>
        <CardHeader
          title={`Planul lunii: ${plan.title}`}
          subtitle={`${mp.done}/${mp.total} teme din materie programate luna aceasta sunt finalizate`}
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <ul className="space-y-1.5">
            {plan.objectives.map((o) => (
              <li key={o} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {o}
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-4 lg:grid-cols-8">
            {MONTH_PLAN.map((m) => {
              const p = monthProgress(tasks, m.month);
              const current = m.month === curMonth;
              return (
                <div key={m.month} className={cx('flex flex-col items-center gap-1.5 rounded-lg py-2', current && 'bg-accent-soft/50')}>
                  <div className="relative flex h-20 w-3 items-end overflow-hidden rounded-full bg-slate-100">
                    <div className={cx('w-full rounded-full transition-[height] duration-500', p.pct >= 100 ? 'bg-success' : 'bg-accent')} style={{ height: `${p.pct}%` }} />
                  </div>
                  <span className={cx('text-[11px]', current ? 'font-semibold text-blue-700' : 'text-muted')}>{formatMonthShort(m.month)}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">{p.total ? `${p.pct}%` : '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ContinueCard({ taskId }: { taskId: string }) {
  const { data, openTask, setStatus } = useStore();
  const task = data.tasks.find((t) => t.id === taskId)!;
  const ch = CHAPTER_BY_ID[task.chapterId];
  const mod = MODULE_BY_ID[task.moduleId];
  const chTasks = scopeTasks(data.tasks.filter((t) => t.chapterId === task.chapterId), task.moduleId);
  const p = progressOf(chTasks);
  const nextInChapter = chTasks.filter((t) => t.status !== 'completed' && t.id !== task.id).sort((a, b) => a.order - b.order)[0];
  const modP = progressOf(data.tasks.filter((t) => t.moduleId === task.moduleId && countsForProgress(t)));
  return (
    <div>
      <div className="text-xs font-medium text-muted">
        Modulul {mod.code} · {mod.short} · {modP.pct}%
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">
        {ch.code} {ch.title}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ProgressBar value={p.pct} size="sm" />
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {p.done}/{p.total}
        </span>
      </div>
      <div className="mt-4 rounded-lg border border-line p-3">
        <div className="text-[11px] font-medium tracking-wide text-muted uppercase">{task.status === 'in_progress' ? 'În desfășurare' : 'Următoarea temă'}</div>
        <div className="mt-1 text-sm text-ink">{task.title}</div>
        {nextInChapter && <div className="mt-1 truncate text-xs text-muted">apoi: {nextInChapter.title}</div>}
        <div className="mt-3 flex gap-2">
          {task.status !== 'in_progress' && (
            <Button size="sm" variant="primary" onClick={() => setStatus(task.id, 'in_progress')}>
              Începe
            </Button>
          )}
          <Button size="sm" onClick={() => openTask(task.id)}>
            Detalii
          </Button>
        </div>
      </div>
    </div>
  );
}
