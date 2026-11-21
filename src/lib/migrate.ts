/**
 * Migrarea datelor salvate la o nouă structură a materiei.
 *
 * Versiunea 1 → 2: temele au ID-uri noi. Fiecare temă nouă preia progresul temelor
 * vechi din care provine (`from` în curriculum.ts):
 *  - toate temele vechi finalizate → tema nouă e finalizată (cu data finalizării);
 *  - doar o parte începute / finalizate → tema nouă e „în desfășurare”;
 *  - notele, etichetele, dificultatea și timpul efectiv se păstrează.
 * Taskurile personale, recapitulările săptămânale, simulările, recapitulările și
 * competențele rămân neschimbate (taskurile personale trec în capitolul nou corespunzător).
 */
import { CHAPTER_BY_ID, CURRICULUM_VERSION, V1_CHAPTER_REMAP } from '../data/curriculum';
import type { AppData, ISODate, Task } from '../types';
import { schedulePlan } from './scheduler';
import { buildSeedTasks, seedOrigins } from './seed';

/** Temele generate din programa versiunii 1 (ex. „m1-1.2-05”, „mp-P.2-03”). */
const isV1Seed = (t: Task) => !t.custom && /^m[0-9p]-/.test(t.id);

const maxDate = (xs: (ISODate | null)[]): ISODate | null => {
  const ds = xs.filter((x): x is ISODate => !!x).sort();
  return ds.length ? ds[ds.length - 1] : null;
};

export const needsMigration = (data: Pick<AppData, 'curriculumVersion'>) =>
  (data.curriculumVersion ?? 1) < CURRICULUM_VERSION;

function fromOld(fresh: Task, src: Task[], today: ISODate): Task {
  if (!src.length) return fresh;
  const allDone = src.every((s) => s.status === 'completed');
  const started = src.some((s) => s.status !== 'not_started');
  const status: Task['status'] = allDone ? 'completed' : started ? 'in_progress' : 'not_started';

  const notes = [...new Set(src.map((s) => s.notes.trim()).filter(Boolean))].join('\n\n');
  const labels = [...new Set(src.flatMap((s) => s.labels ?? []))];
  const difficulty = src.find((s) => s.difficulty)?.difficulty ?? null;
  const times = src.map((s) => s.actualMin).filter((x): x is number => typeof x === 'number');

  const next: Task = {
    ...fresh,
    status,
    completedDate: allDone ? (maxDate(src.map((s) => s.completedDate)) ?? today) : null,
    notes,
    labels,
    difficulty,
    actualMin: times.length ? times.reduce((a, b) => a + b, 0) : null,
  };

  // Temele finalizate și cele cu dată fixă (simulări) își păstrează data din calendar.
  if (allDone || fresh.fixedDate) {
    const planned = maxDate(src.map((s) => s.plannedDate));
    if (planned) {
      next.plannedDate = planned;
      next.deadline = maxDate(src.map((s) => s.deadline)) ?? planned;
    }
  }
  return next;
}

export function migrateCurriculum(data: AppData, today: ISODate): AppData {
  if (!needsMigration(data)) return data;

  const old = new Map(data.tasks.filter(isV1Seed).map((t) => [t.id, t]));
  const origins = seedOrigins();
  /** Tema veche → prima temă nouă în care a intrat (pentru legăturile din Recapitulare). */
  const newIdOf = new Map<string, string>();

  const migrated = buildSeedTasks().map((fresh) => {
    const src = (origins.get(fresh.id) ?? []).map((id) => old.get(id)).filter((x): x is Task => !!x);
    for (const s of src) if (!newIdOf.has(s.id)) newIdOf.set(s.id, fresh.id);
    return fromOld(fresh, src, today);
  });

  const kept = data.tasks
    .filter((t) => !isV1Seed(t))
    .map((t) => {
      if (!t.custom) return t;
      const chapterId = V1_CHAPTER_REMAP[t.chapterId] ?? t.chapterId;
      const ch = CHAPTER_BY_ID[chapterId];
      return ch ? { ...t, chapterId, moduleId: ch.moduleId } : t;
    });

  return {
    ...data,
    curriculumVersion: CURRICULUM_VERSION,
    tasks: schedulePlan([...kept, ...migrated], data.settings, today),
    revisions: data.revisions.map((r) =>
      r.taskId && old.has(r.taskId) ? { ...r, taskId: newIdOf.get(r.taskId) ?? null } : r,
    ),
  };
}
