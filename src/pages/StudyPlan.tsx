import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Info, Plus, Search, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CHAPTERS, MODULES } from '../data/curriculum';
import { TASK_TYPES, TYPE_LABEL } from '../lib/labels';
import { groupBy, isOverdue, nextUpTask, progressOf, scopeTasks, summarize } from '../lib/progress';
import { useStore } from '../store/AppStore';
import type { Chapter, Module, Status, Task, TaskType } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { AddTaskForm } from '../components/tasks/AddTaskForm';
import { TaskRow } from '../components/tasks/TaskRow';
import { useFeedback } from '../components/ui/Feedback';
import { Badge, Button, Card, Checkbox, EmptyState, Input, ProgressBar, Segmented, Select, cx } from '../components/ui/primitives';
import { TagFilter } from '../components/ui/Tags';
import { allLabels, hasLabel, type Difficulty } from '../lib/tags';

type Filter = 'all' | 'not_started' | 'in_progress' | 'completed' | 'overdue';

const UI_KEY = 'bacgeo2027.ui.plan';

function loadOpen(): string[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(UI_KEY) ?? 'null');
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function StudyPlan() {
  const { data, today } = useStore();
  const { tasks } = data;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [type, setType] = useState<TaskType | 'all'>('all');
  const [fLabel, setFLabel] = useState<string | null>(null);
  const [fDiff, setFDiff] = useState<Difficulty | null>(null);
  const labels = useMemo(() => allLabels(tasks), [tasks]);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => {
    const saved = loadOpen();
    if (saved) return new Set(saved);
    const n = nextUpTask(tasks);
    return new Set(n ? [n.moduleId, n.chapterId] : ['m0']);
  });

  useEffect(() => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify([...open]));
    } catch {
      /* preferință locală — ignoră */
    }
  }, [open]);

  const toggleOpen = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const summary = useMemo(() => summarize(tasks, today), [tasks, today]);

  const counts = useMemo(() => {
    const base = tasks.filter((t) => type === 'all' || t.type === type);
    return {
      all: base.length,
      not_started: base.filter((t) => t.status === 'not_started').length,
      in_progress: base.filter((t) => t.status === 'in_progress').length,
      completed: base.filter((t) => t.status === 'completed').length,
      overdue: base.filter((t) => isOverdue(t, today)).length,
    };
  }, [tasks, type, today]);

  const q = norm(query.trim());
  const filtering = q !== '' || filter !== 'all' || type !== 'all' || !!fLabel || !!fDiff;

  const visible = useMemo(() => {
    const match = (t: Task) =>
      (filter === 'all' || (filter === 'overdue' ? isOverdue(t, today) : t.status === (filter as Status))) &&
      (type === 'all' || t.type === type) &&
      (!fLabel || hasLabel(t.labels, fLabel)) &&
      (!fDiff || t.difficulty === fDiff) &&
      (!q || norm(t.title).includes(q));
    return tasks.filter(match);
  }, [tasks, filter, type, q, today, fLabel, fDiff]);

  const visibleByChapter = useMemo(() => groupBy(visible, (t) => t.chapterId), [visible]);
  const allByChapter = useMemo(() => groupBy(tasks, (t) => t.chapterId), [tasks]);
  const allByModule = useMemo(() => groupBy(tasks, (t) => t.moduleId), [tasks]);

  const expandAll = () => setOpen(new Set([...MODULES.map((m) => m.id), ...CHAPTERS.map((c) => c.id)]));
  const collapseAll = () => setOpen(new Set());

  const modulesShown = MODULES.filter((m) =>
    !filtering ? true : CHAPTERS.some((c) => c.moduleId === m.id && visibleByChapter.has(c.id)),
  );

  return (
    <div>
      <PageHeader
        title="Study Plan"
        subtitle={`${summary.overall.done} din ${summary.overall.total} teme finalizate · ${summary.overall.pct}% din materie`}
        actions={
          <>
            <Button size="sm" variant="ghost" icon={<ChevronsUpDown className="h-4 w-4" />} onClick={expandAll}>
              Extinde tot
            </Button>
            <Button size="sm" variant="ghost" icon={<ChevronsDownUp className="h-4 w-4" />} onClick={collapseAll}>
              Restrânge
            </Button>
            <Button size="sm" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding((v) => !v)}>
              Task personal
            </Button>
          </>
        }
      />

      {adding && <AddTaskForm className="mb-4 bg-white" onDone={() => setAdding(false)} />}

      {/* Bara de filtre */}
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-col gap-2 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8 xl:flex-row xl:items-center">
        <div className="relative w-full xl:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută o temă…" className="pr-8 pl-9" aria-label="Caută după denumirea temei" />
          {query && (
            <button aria-label="Șterge căutarea" onClick={() => setQuery('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Toate', count: counts.all },
              { value: 'not_started', label: 'Neîncepute', count: counts.not_started },
              { value: 'in_progress', label: 'În desfășurare', count: counts.in_progress },
              { value: 'completed', label: 'Finalizate', count: counts.completed },
              { value: 'overdue', label: 'Restante', count: counts.overdue },
            ]}
          />
          <Select value={type} onChange={(e) => setType(e.target.value as TaskType | 'all')} className="h-8 !w-44 text-[13px]" aria-label="Filtrează după tip">
            <option value="all">Toate tipurile</option>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <TagFilter labels={labels} label={fLabel} onLabel={setFLabel} difficulty={fDiff} onDifficulty={setFDiff} />
      </div>

      {filtering && (
        <p className="mb-3 text-[13px] text-muted">
          {visible.length} {visible.length === 1 ? 'rezultat' : 'rezultate'}
        </p>
      )}

      <div className="space-y-3">
        {modulesShown.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            moduleTasks={allByModule.get(m.id) ?? []}
            allByChapter={allByChapter}
            visibleByChapter={visibleByChapter}
            filtering={filtering}
            open={open}
            toggleOpen={toggleOpen}
          />
        ))}
        {filtering && !visible.length && (
          <Card>
            <EmptyState icon={<SearchX className="h-5 w-5" />} title="Nicio temă găsită" text="Încearcă alt cuvânt sau alt filtru." />
          </Card>
        )}
      </div>
    </div>
  );
}

function ModuleCard({
  module: m,
  moduleTasks,
  allByChapter,
  visibleByChapter,
  filtering,
  open,
  toggleOpen,
}: {
  module: Module;
  moduleTasks: Task[];
  allByChapter: Map<string, Task[]>;
  visibleByChapter: Map<string, Task[]>;
  filtering: boolean;
  open: Set<string>;
  toggleOpen: (id: string) => void;
}) {
  const p = progressOf(scopeTasks(moduleTasks, m.id));
  const complete = p.total > 0 && p.done === p.total;
  const isOpen = filtering || open.has(m.id);
  const chapters = CHAPTERS.filter((c) => c.moduleId === m.id && (!filtering || visibleByChapter.has(c.id)));

  return (
    <Card padded={false} className="overflow-hidden">
      <button
        type="button"
        onClick={() => toggleOpen(m.id)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/70 sm:px-5"
      >
        <ChevronDown className={cx('h-4 w-4 shrink-0 text-muted transition-transform duration-200', !isOpen && '-rotate-90')} />
        <span
          className={cx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold',
            complete ? 'bg-green-50 text-success' : m.countsForProgress ? 'bg-accent-soft text-blue-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {m.code}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-ink">{m.title}</span>
            {complete && <Badge className="bg-green-50 text-success">Finalizat</Badge>}
            {!m.countsForProgress && <Badge className="bg-amber-50 text-amber-700">urmărit separat</Badge>}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {p.done} finalizate · {p.remaining} rămase
            {p.inProgress ? ` · ${p.inProgress} în desfășurare` : ''}
          </span>
        </span>
        <span className="hidden w-44 shrink-0 items-center gap-2.5 sm:flex">
          <ProgressBar value={p.pct} size="sm" />
          <span className="w-9 text-right text-xs font-medium text-ink tabular-nums">{p.pct}%</span>
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-line">
          {chapters.map((ch) => (
            <ChapterBlock
              key={ch.id}
              chapter={ch}
              all={allByChapter.get(ch.id) ?? []}
              shown={filtering ? (visibleByChapter.get(ch.id) ?? []) : (allByChapter.get(ch.id) ?? [])}
              isOpen={filtering || open.has(ch.id)}
              onToggle={() => toggleOpen(ch.id)}
              filtering={filtering}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ChapterBlock({
  chapter: ch,
  all,
  shown,
  isOpen,
  onToggle,
  filtering,
}: {
  chapter: Chapter;
  all: Task[];
  shown: Task[];
  isOpen: boolean;
  onToggle: () => void;
  filtering: boolean;
}) {
  const { toggleChapter, setStatus } = useStore();
  const { toast } = useFeedback();
  const [adding, setAdding] = useState(false);
  const scoped = scopeTasks(all, ch.moduleId);
  const p = progressOf(scoped.length ? scoped : all);
  const allDone = all.length > 0 && all.every((t) => t.status === 'completed');
  const some = all.some((t) => t.status === 'completed');
  const sorted = [...shown].sort((a, b) =>
    ch.id.endsWith('P.5') ? (a.plannedDate ?? '').localeCompare(b.plannedDate ?? '') : a.order - b.order,
  );

  const onCheck = () => {
    if (!all.length) return;
    const snapshot = all.map((t) => [t.id, t.status] as const);
    toggleChapter(ch.id);
    toast(allDone ? `„${ch.title}” redeschis.` : `Toate temele din „${ch.title}” au fost bifate.`, 'success', {
      label: 'Anulează',
      onClick: () => snapshot.forEach(([id, s]) => setStatus(id, s)),
    });
  };

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
        <span className="w-4 shrink-0" />
        <Checkbox
          checked={allDone}
          indeterminate={!allDone && some}
          onChange={onCheck}
          label={allDone ? 'Redeschide subcapitolul' : 'Bifează tot subcapitolul'}
        />
        <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown className={cx('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', !isOpen && '-rotate-90')} />
          <span className="min-w-0 flex-1">
            <span className={cx('text-sm font-medium', allDone ? 'text-muted' : 'text-ink')}>
              <span className="mr-1.5 text-muted tabular-nums">{ch.code}</span>
              {ch.title}
            </span>
            {ch.support && <Badge className="ml-2 bg-slate-100 text-slate-500">suport</Badge>}
          </span>
          <span className="hidden w-28 shrink-0 sm:block">
            <ProgressBar value={p.pct} size="sm" />
          </span>
          <span className="w-12 shrink-0 text-right text-xs text-muted tabular-nums">
            {p.done}/{p.total}
          </span>
        </button>
      </div>
      {isOpen && (
        <div className="pb-2 pl-6 pr-2 sm:pl-12 sm:pr-3">
          {ch.note && (
            <p className="mb-1 ml-2.5 flex items-start gap-1.5 text-xs text-muted">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" /> {ch.note}
            </p>
          )}
          <div className="divide-y divide-slate-100">
            {sorted.map((t) => (
              <TaskRow key={t.id} task={t} showChapter={false} />
            ))}
          </div>
          {!filtering &&
            (adding ? (
              <AddTaskForm chapterId={ch.id} onDone={() => setAdding(false)} className="mt-2 ml-2.5" />
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-1 ml-2.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-muted hover:bg-slate-100 hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Adaugă task personal
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
