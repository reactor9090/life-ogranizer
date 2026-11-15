/**
 * Logica de progres: progresul se calculează DOAR după teme finalizate
 * (finalizate / total × 100), nu după timp. Recapitulările și simulările sunt
 * urmărite separat, pentru a nu distorsiona progresul materiei.
 */
import { CHAPTERS, MODULES, MODULE_BY_ID } from '../data/curriculum';
import type { ISODate, MonthKey, Task } from '../types';

export interface Progress {
  done: number;
  total: number;
  inProgress: number;
  remaining: number;
  pct: number;
}

export function countsForProgress(t: Task): boolean {
  const mod = MODULE_BY_ID[t.moduleId];
  return !!mod && mod.countsForProgress && t.type !== 'revision' && t.tag !== 'simulation';
}

export function progressOf(tasks: Task[]): Progress {
  let done = 0;
  let inProgress = 0;
  for (const t of tasks) {
    if (t.status === 'completed') done++;
    else if (t.status === 'in_progress') inProgress++;
  }
  const total = tasks.length;
  return {
    done,
    total,
    inProgress,
    remaining: total - done,
    pct: total ? Math.round((done / total) * 100) : 0,
  };
}

/** Taskurile care contează pentru un capitol/modul (în modulul de antrenament: toate). */
export function scopeTasks(tasks: Task[], moduleId: string): Task[] {
  const mod = MODULE_BY_ID[moduleId];
  if (mod && !mod.countsForProgress) return tasks;
  return tasks.filter(countsForProgress);
}

export function isOverdue(t: Task, today: ISODate): boolean {
  if (t.status === 'completed') return false;
  const ref = t.deadline ?? t.plannedDate;
  return !!ref && ref < today;
}

/** Planificat în trecut, dar nefinalizat (chiar dacă termenul limită nu a trecut). */
export function isLate(t: Task, today: ISODate): boolean {
  return t.status !== 'completed' && !!t.plannedDate && t.plannedDate < today;
}

export type VisualState = 'completed' | 'overdue' | 'in_progress' | 'not_started';

export function visualState(t: Task, today: ISODate): VisualState {
  if (t.status === 'completed') return 'completed';
  if (isOverdue(t, today)) return 'overdue';
  return t.status;
}

export function groupBy<T>(items: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

export interface Summary {
  overall: Progress;
  modules: { id: string; progress: Progress; complete: boolean }[];
  chaptersDone: number;
  chaptersTotal: number;
  modulesDone: number;
  modulesTotal: number;
  overdue: number;
  practice: Progress;
}

export function summarize(tasks: Task[], today: ISODate): Summary {
  const counted = tasks.filter(countsForProgress);
  const byModule = groupBy(tasks, (t) => t.moduleId);
  const byChapter = groupBy(tasks, (t) => t.chapterId);

  const modules = MODULES.map((m) => {
    const scoped = scopeTasks(byModule.get(m.id) ?? [], m.id);
    const progress = progressOf(scoped);
    return { id: m.id, progress, complete: progress.total > 0 && progress.done === progress.total };
  });

  let chaptersDone = 0;
  let chaptersTotal = 0;
  for (const ch of CHAPTERS) {
    if (!MODULE_BY_ID[ch.moduleId].countsForProgress) continue;
    const scoped = scopeTasks(byChapter.get(ch.id) ?? [], ch.moduleId);
    if (!scoped.length) continue;
    chaptersTotal++;
    if (scoped.every((t) => t.status === 'completed')) chaptersDone++;
  }

  const realModules = modules.filter((m) => MODULE_BY_ID[m.id].countsForProgress);

  return {
    overall: progressOf(counted),
    modules,
    chaptersDone,
    chaptersTotal,
    modulesDone: realModules.filter((m) => m.complete).length,
    modulesTotal: realModules.length,
    overdue: tasks.filter((t) => isOverdue(t, today)).length,
    practice: progressOf(tasks.filter((t) => !countsForProgress(t))),
  };
}

export function monthProgress(tasks: Task[], month: MonthKey): Progress {
  return progressOf(tasks.filter((t) => countsForProgress(t) && t.plannedDate?.startsWith(month)));
}

/** Următoarea temă nefinalizată, în ordinea planului. */
export function nextUpTask(tasks: Task[]): Task | undefined {
  const open = tasks.filter((t) => countsForProgress(t) && t.status !== 'completed');
  const inProg = open.filter((t) => t.status === 'in_progress');
  const pool = inProg.length ? inProg : open;
  return [...pool].sort(
    (a, b) => (a.plannedDate ?? '9999').localeCompare(b.plannedDate ?? '9999') || a.order - b.order,
  )[0];
}
