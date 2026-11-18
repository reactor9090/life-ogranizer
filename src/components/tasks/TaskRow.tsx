import type { ReactNode } from 'react';
import { AlertCircle, Clock, Flag, MoreHorizontal, PlayCircle, StickyNote } from 'lucide-react';
import { CHAPTER_BY_ID } from '../../data/curriculum';
import { formatMinutes, formatShort } from '../../lib/dates';
import { PRIORITY_LABEL, PRIORITY_STYLE, TYPE_LABEL, TYPE_STYLE } from '../../lib/labels';
import { visualState } from '../../lib/progress';
import { useStore } from '../../store/AppStore';
import type { Task } from '../../types';
import { Badge, Checkbox, IconButton, cx } from '../ui/primitives';
import { useFeedback } from '../ui/Feedback';
import { DifficultyChip, LabelChip } from '../ui/Tags';
import { DateChip } from './DateChip';

export function TaskRow({
  task,
  showChapter = true,
  showDeadline = true,
  extra,
  className,
}: {
  task: Task;
  showChapter?: boolean;
  showDeadline?: boolean;
  extra?: ReactNode;
  className?: string;
}) {
  const { today, toggleTask, setStatus, moveTask, openTask } = useStore();
  const { toast } = useFeedback();
  const vs = visualState(task, today);
  const ch = CHAPTER_BY_ID[task.chapterId];
  const done = task.status === 'completed';

  const onToggle = () => {
    toggleTask(task.id);
    if (!done) toast('Temă finalizată. Bravo!', 'success', { label: 'Anulează', onClick: () => toggleTask(task.id) });
  };

  return (
    <div
      className={cx(
        'group flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-slate-50',
        vs === 'overdue' && 'bg-amber-50/40',
        className,
      )}
    >
      <Checkbox checked={done} onChange={onToggle} label={done ? 'Marchează ca nefinalizat' : 'Marchează ca finalizat'} className="mt-0.5" />

      <button type="button" onClick={() => openTask(task.id)} className="min-w-0 flex-1 text-left">
        <div className={cx('text-sm leading-snug', done ? 'text-muted line-through decoration-slate-300' : 'text-ink')}>
          {task.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {showChapter && ch && (
            <span className="truncate max-w-[260px]">
              {ch.code} · {ch.title}
            </span>
          )}
          <span className={cx('inline-flex items-center gap-1 rounded px-1.5 py-px text-[11px] font-medium', TYPE_STYLE[task.type].chip)}>
            {TYPE_LABEL[task.type]}
          </span>
          {task.difficulty && <DifficultyChip value={task.difficulty} />}
          {task.labels?.map((l) => (
            <LabelChip key={l} label={l} />
          ))}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatMinutes(task.estimatedMin)}
          </span>
          {showDeadline && task.deadline && !done && (
            <span className={cx('inline-flex items-center gap-1', vs === 'overdue' && 'font-medium text-amber-700')}>
              <Flag className="h-3 w-3" />
              limită {formatShort(task.deadline)}
            </span>
          )}
          {task.notes && <StickyNote className="h-3 w-3" aria-label="Are note" />}
          {task.support && <span className="text-slate-400">suport</span>}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {vs === 'overdue' && (
          <Badge className="bg-amber-50 text-amber-700 max-sm:hidden">
            <AlertCircle className="h-3 w-3" /> Restant
          </Badge>
        )}
        {vs === 'in_progress' && <Badge className="bg-accent-soft text-blue-700 max-sm:hidden">În lucru</Badge>}
        {!done && (
          <Badge className={cx('max-md:hidden', PRIORITY_STYLE[task.priority])}>{PRIORITY_LABEL[task.priority]}</Badge>
        )}
        {!done && (
          <DateChip
            value={task.plannedDate}
            onChange={(d) => moveTask(task.id, d)}
            today={today}
            tone={vs === 'overdue' ? 'warn' : 'default'}
            label="Data planificată"
          />
        )}
        {!done && (
          <IconButton
            label={task.status === 'in_progress' ? 'Oprește „în desfășurare”' : 'Marchează în desfășurare'}
            onClick={() => setStatus(task.id, task.status === 'in_progress' ? 'not_started' : 'in_progress')}
            className={cx('max-sm:hidden', task.status === 'in_progress' && 'text-accent')}
          >
            <PlayCircle className="h-4 w-4" />
          </IconButton>
        )}
        {extra}
        <IconButton label="Detalii și editare" onClick={() => openTask(task.id)}>
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}
