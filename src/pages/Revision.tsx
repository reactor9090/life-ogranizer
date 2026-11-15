import { Check, Info, Plus, Repeat2, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { CHAPTER_BY_ID } from '../data/curriculum';
import { addDays, formatShort, relativeDay } from '../lib/dates';
import { REVISION_INTERVALS, useStore } from '../store/AppStore';
import type { ISODate, RevisionItem, RevisionStep } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, Segmented, cx } from '../components/ui/primitives';

type Tab = 'due' | 'upcoming' | 'all' | 'done';

const nextStep = (r: RevisionItem) => r.steps.find((s) => !s.doneDate);

export function RevisionPage() {
  const { data, today, addRevision } = useStore();
  const { toast } = useFeedback();
  // Implicit: „Azi și restante” dacă există ceva de făcut, altfel „Programate”.
  const [tab, setTab] = useState<Tab>(() =>
    data.revisions.some((r) => nextStep(r) && nextStep(r)!.dueDate <= today) ? 'due' : 'upcoming',
  );
  const [title, setTitle] = useState('');
  const [start, setStart] = useState<ISODate>(today);
  const [useIntervals, setUseIntervals] = useState(true);
  const [single, setSingle] = useState<ISODate>(addDays(today, 1));

  const completedTitles = useMemo(
    () => data.tasks.filter((t) => t.status === 'completed').map((t) => t.title),
    [data.tasks],
  );

  const groups = useMemo(() => {
    const due: RevisionItem[] = [];
    const upcoming: RevisionItem[] = [];
    const done: RevisionItem[] = [];
    for (const r of data.revisions) {
      const n = nextStep(r);
      if (!n) done.push(r);
      else if (n.dueDate <= today) due.push(r);
      else upcoming.push(r);
    }
    const byNext = (a: RevisionItem, b: RevisionItem) => (nextStep(a)?.dueDate ?? '').localeCompare(nextStep(b)?.dueDate ?? '');
    return { due: due.sort(byNext), upcoming: upcoming.sort(byNext), done, all: [...data.revisions].sort(byNext) };
  }, [data.revisions, today]);

  const overdueCount = groups.due.filter((r) => nextStep(r)!.dueDate < today).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const task = data.tasks.find((t) => t.title === title.trim());
    addRevision({ title, taskId: task?.id ?? null, start, useIntervals, singleDate: single });
    toast(useIntervals ? 'Adăugat cu 5 repetări recomandate.' : 'Adăugat la recapitulare.');
    setTitle('');
    const firstDue = useIntervals ? addDays(start, REVISION_INTERVALS[0]) : single;
    setTab(firstDue <= today ? 'due' : 'upcoming');
  };

  const list = groups[tab];

  return (
    <div className="space-y-5">
      <PageHeader title="Revision" subtitle="Temele pe care vrei să le repeți. Recapitulările nu influențează progresul materiei." />

      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_170px]">
            <Field label="Temă de recapitulat">
              <Input
                list="completed-tasks"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Scrie o temă sau alege una deja finalizată…"
              />
              <datalist id="completed-tasks">
                {completedTitles.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Am învățat-o pe">
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={useIntervals} onChange={(e) => setUseIntervals(e.target.checked)} className="h-4 w-4 accent-[#2563EB]" />
                Folosește intervalele recomandate
              </label>
              {useIntervals ? (
                <div className="flex flex-wrap gap-1.5">
                  {REVISION_INTERVALS.map((n, i) => (
                    <Badge key={n} className="bg-emerald-50 text-emerald-700">
                      R{i + 1}: +{n} {n === 1 ? 'zi' : 'zile'} · {formatShort(addDays(start, n))}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted">
                  O singură repetare pe
                  <Input type="date" value={single} onChange={(e) => setSingle(e.target.value)} className="h-8 w-auto" />
                </div>
              )}
            </div>
            <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" />} disabled={!title.trim()}>
              Adaugă la recapitulare
            </Button>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Intervalele 1–3–7–14–30 zile sunt doar recomandări. Poți schimba orice dată (click pe ea) sau adăuga repetări.
          </p>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'due', label: 'Azi și restante', count: groups.due.length },
            { value: 'upcoming', label: 'Programate', count: groups.upcoming.length },
            { value: 'all', label: 'Toate', count: groups.all.length },
            { value: 'done', label: 'Încheiate', count: groups.done.length },
          ]}
        />
        {overdueCount > 0 && <span className="text-[13px] text-amber-700">{overdueCount} recapitulări restante</span>}
      </div>

      <div className="space-y-2.5">
        {list.map((r) => (
          <RevisionCard key={r.id} item={r} />
        ))}
        {!list.length && (
          <Card>
            <EmptyState
              icon={<Repeat2 className="h-5 w-5" />}
              title={tab === 'due' ? 'Nimic de recapitulat azi' : 'Nicio temă aici'}
              text="Adaugă teme din formularul de mai sus, din detaliile unui task sau din BAC Practice."
            />
          </Card>
        )}
      </div>
    </div>
  );
}

function RevisionCard({ item }: { item: RevisionItem }) {
  const { data, today, toggleStep, deleteRevision, addStep, openTask } = useStore();
  const { confirm, toast } = useFeedback();
  const n = nextStep(item);
  const done = item.steps.filter((s) => s.doneDate).length;
  const task = item.taskId ? data.tasks.find((t) => t.id === item.taskId) : undefined;
  const ch = task ? CHAPTER_BY_ID[task.chapterId] : undefined;
  const overdue = n && n.dueDate < today;
  const addRef = useRef<HTMLInputElement>(null);

  const onDelete = async () => {
    if (await confirm({ title: 'Elimini tema din recapitulare?', text: item.title, confirmLabel: 'Elimină', danger: true })) {
      deleteRevision(item.id);
      toast('Eliminat din recapitulare.', 'info');
    }
  };

  return (
    <Card className={cx('!py-3.5', overdue && 'border-amber-200')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
            {overdue && <Badge className="bg-amber-50 text-amber-700">Restant</Badge>}
            {!n && <Badge className="bg-green-50 text-success">Încheiat</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {ch ? (
              <button className="hover:text-accent" onClick={() => openTask(task!.id)}>
                {ch.code} · {ch.title}
              </button>
            ) : (
              'Temă adăugată manual'
            )}
            {' · '}
            {done}/{item.steps.length} repetări
            {n && <> · următoarea: <span className={cx('font-medium', overdue ? 'text-amber-700' : 'text-ink')}>{relativeDay(n.dueDate, today)}</span></>}
          </p>
          {item.notes && <p className="mt-1 text-xs text-muted">{item.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {n && (
            <Button size="sm" variant="primary" icon={<Check className="h-4 w-4" />} onClick={() => { toggleStep(item.id, n.id); toast('Recapitulare efectuată.'); }}>
              Efectuată
            </Button>
          )}
          <IconButton label="Șterge" onClick={onDelete} className="hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {item.steps.map((s, i) => (
          <StepPill key={s.id} revId={item.id} step={s} index={i} today={today} />
        ))}
        <span className="relative">
          <button
            type="button"
            onClick={() => {
              try {
                addRef.current?.showPicker();
              } catch {
                addRef.current?.focus();
              }
            }}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-slate-300 px-2 text-xs text-muted hover:border-accent hover:text-accent"
          >
            <Plus className="h-3 w-3" /> repetare
          </button>
          <input
            ref={addRef}
            type="date"
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0"
            onChange={(e) => e.target.value && addStep(item.id, e.target.value)}
          />
        </span>
      </div>
    </Card>
  );
}

function StepPill({ revId, step, index, today }: { revId: string; step: RevisionStep; index: number; today: ISODate }) {
  const { toggleStep, setStepDate, removeStep } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const done = !!step.doneDate;
  const overdue = !done && step.dueDate < today;
  return (
    <span
      className={cx(
        'group relative inline-flex h-7 items-center gap-1 rounded-md pr-1 pl-1 text-xs font-medium',
        done ? 'bg-green-50 text-success' : overdue ? 'bg-amber-50 text-amber-700' : step.dueDate === today ? 'bg-accent-soft text-blue-700' : 'bg-slate-100 text-slate-600',
      )}
    >
      <button
        type="button"
        onClick={() => toggleStep(revId, step.id)}
        className="flex h-5 w-5 items-center justify-center rounded"
        aria-label={done ? 'Marchează ca neefectuată' : 'Marchează ca efectuată'}
        title={done ? 'Marchează ca neefectuată' : 'Marchează ca efectuată'}
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-current" />}
      </button>
      <button
        type="button"
        title="Schimbă data"
        onClick={() => {
          try {
            ref.current?.showPicker();
          } catch {
            ref.current?.focus();
          }
        }}
      >
        R{index + 1} · {formatShort(step.dueDate)}
      </button>
      <button
        type="button"
        aria-label="Elimină repetarea"
        title="Elimină repetarea"
        onClick={() => removeStep(revId, step.id)}
        className="ml-0.5 hidden h-4 w-4 items-center justify-center rounded text-current/60 group-hover:inline-flex hover:bg-black/5"
      >
        ×
      </button>
      <input
        ref={ref}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={step.dueDate}
        onChange={(e) => e.target.value && setStepDate(revId, step.id, e.target.value)}
        className="pointer-events-none absolute inset-0 opacity-0"
      />
    </span>
  );
}
