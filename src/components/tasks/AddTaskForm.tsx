import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CHAPTERS } from '../../data/curriculum';
import { PRIORITIES, PRIORITY_LABEL, TASK_TYPES, TYPE_LABEL } from '../../lib/labels';
import { useStore } from '../../store/AppStore';
import type { ISODate, Priority, TaskType } from '../../types';
import { useFeedback } from '../ui/Feedback';
import { Button, Input, Select, cx } from '../ui/primitives';

/** Formular compact pentru un task personal. Dacă `chapterId` lipsește, se alege capitolul. */
export function AddTaskForm({
  chapterId,
  defaultDate,
  onDone,
  className,
  autoFocus = true,
}: {
  chapterId?: string;
  defaultDate?: ISODate | null;
  onDone?: () => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const { addTask, today } = useStore();
  const { toast } = useFeedback();
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState(chapterId ?? CHAPTERS[0].id);
  const [type, setType] = useState<TaskType>('theory');
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState<string>(defaultDate === undefined ? today : (defaultDate ?? ''));
  const [est, setEst] = useState(30);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title, chapterId: chapter, type, priority, plannedDate: date || null, estimatedMin: est });
    toast('Task personal adăugat.');
    setTitle('');
    onDone?.();
  };

  return (
    <form onSubmit={submit} className={cx('rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3', className)}>
      <Input
        autoFocus={autoFocus}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titlul taskului personal…"
        aria-label="Titlul taskului"
      />
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {!chapterId && (
          <Select value={chapter} onChange={(e) => setChapter(e.target.value)} aria-label="Capitol" className="col-span-2 sm:col-span-4">
            {CHAPTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.title}
              </option>
            ))}
          </Select>
        )}
        <Select value={type} onChange={(e) => setType(e.target.value as TaskType)} aria-label="Tip">
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Prioritate">
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              Prioritate: {PRIORITY_LABEL[p].toLowerCase()}
            </option>
          ))}
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data planificată" />
        <Input type="number" min={5} step={5} value={est} onChange={(e) => setEst(Number(e.target.value) || 30)} aria-label="Minute estimate" title="Minute estimate" />
      </div>
      <div className="mt-2.5 flex justify-end gap-2">
        {onDone && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Anulează
          </Button>
        )}
        <Button size="sm" variant="primary" type="submit" icon={<Plus className="h-4 w-4" />} disabled={!title.trim()}>
          Adaugă
        </Button>
      </div>
    </form>
  );
}
