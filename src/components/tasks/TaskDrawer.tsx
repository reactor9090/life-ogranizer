import { CalendarPlus, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CHAPTERS, CHAPTER_BY_ID, MODULE_BY_ID } from '../../data/curriculum';
import { formatLong } from '../../lib/dates';
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, TASK_TYPES, TYPE_LABEL } from '../../lib/labels';
import { isOverdue } from '../../lib/progress';
import { useStore } from '../../store/AppStore';
import type { Priority, Status } from '../../types';
import { Drawer } from '../ui/Drawer';
import { useFeedback } from '../ui/Feedback';
import { Badge, Button, Field, Input, Segmented, Select, Textarea } from '../ui/primitives';

export function TaskDrawer() {
  const { data, today, editingTaskId, openTask, updateTask, setStatus, moveTask, deleteTask, addRevision } = useStore();
  const { confirm, toast } = useFeedback();
  const task = data.tasks.find((t) => t.id === editingTaskId) ?? null;
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
  }, [task?.id]);

  if (!task) return null;
  const ch = CHAPTER_BY_ID[task.chapterId];
  const mod = MODULE_BY_ID[task.moduleId];
  const close = () => openTask(null);

  const commitTitle = () => {
    const v = title.trim();
    if (v && v !== task.title) updateTask(task.id, { title: v });
    else setTitle(task.title);
  };
  const commitNotes = () => notes !== task.notes && updateTask(task.id, { notes });

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Ștergi acest task personal?',
      text: `„${task.title}” va fi eliminat definitiv.`,
      confirmLabel: 'Șterge',
      danger: true,
    });
    if (ok) {
      deleteTask(task.id);
      close();
      toast('Task șters.', 'info');
    }
  };

  const toRevision = () => {
    addRevision({ title: task.title, taskId: task.id, start: today, useIntervals: true });
    toast('Adăugat la recapitulare (1, 3, 7, 14, 30 zile).', 'success');
  };

  const num = (v: string) => (v === '' ? null : Math.max(0, Math.round(Number(v))));

  return (
    <Drawer
      open
      onClose={close}
      title={
        <span className="flex items-center gap-2">
          Detalii task
          {isOverdue(task, today) && <Badge className="bg-amber-50 text-amber-700">Restant</Badge>}
          {task.custom && <Badge>Personal</Badge>}
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button size="sm" variant="soft" icon={<CalendarPlus className="h-4 w-4" />} onClick={toRevision}>
              La recapitulare
            </Button>
            {task.custom && (
              <Button size="sm" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete}>
                Șterge
              </Button>
            )}
          </div>
          <Button size="sm" variant="primary" onClick={close}>
            Gata
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            rows={2}
            aria-label="Titlul taskului"
            className="w-full resize-none rounded-lg border border-transparent px-2 py-1 -mx-2 text-[17px] leading-snug font-semibold text-ink hover:border-line focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-[13px] text-muted">
            Modulul {mod?.code} · {mod?.title}
            <br />
            {ch?.code} · {ch?.title}
          </p>
          {ch?.note && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted">{ch.note}</p>}
        </div>

        <Field label="Status">
          <Segmented<Status>
            value={task.status}
            onChange={(s) => setStatus(task.id, s)}
            options={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
          />
          {task.completedDate && (
            <span className="mt-1.5 flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Finalizat: {formatLong(task.completedDate)}
            </span>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prioritate">
            <Select value={task.priority} onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tip">
            <Select value={task.type} onChange={(e) => updateTask(task.id, { type: e.target.value as typeof task.type })}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data planificată">
            <Input type="date" value={task.plannedDate ?? ''} onChange={(e) => moveTask(task.id, e.target.value || null)} />
          </Field>
          <Field label="Data limită">
            <Input type="date" value={task.deadline ?? ''} onChange={(e) => updateTask(task.id, { deadline: e.target.value || null })} />
          </Field>
          <Field label="Timp estimat (min)">
            <Input
              type="number"
              min={5}
              step={5}
              value={task.estimatedMin}
              onChange={(e) => updateTask(task.id, { estimatedMin: num(e.target.value) ?? 0 })}
            />
          </Field>
          <Field label="Timp efectiv (min)" hint="Opțional">
            <Input
              type="number"
              min={0}
              step={5}
              placeholder="—"
              value={task.actualMin ?? ''}
              onChange={(e) => updateTask(task.id, { actualMin: num(e.target.value) })}
            />
          </Field>
        </div>

        {task.custom && (
          <Field label="Capitol">
            <Select
              value={task.chapterId}
              onChange={(e) => {
                const c = CHAPTER_BY_ID[e.target.value];
                updateTask(task.id, { chapterId: c.id, moduleId: c.moduleId });
              }}
            >
              {CHAPTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Observații personale" hint="Se salvează automat când ieși din câmp.">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={commitNotes}
            placeholder="Ce a fost dificil, din ce sursă am învățat, ce trebuie repetat…"
            rows={5}
          />
        </Field>

        {task.status === 'completed' && (
          <Button size="sm" variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setStatus(task.id, 'not_started')}>
            Redeschide taskul
          </Button>
        )}
      </div>
    </Drawer>
  );
}
