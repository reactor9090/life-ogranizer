/** Generarea datelor inițiale din structura materiei. */
import { MODULE_SEEDS, WEEKLY_REVISION_CHAPTER, chapterId } from '../data/curriculum';
import { SEED_SKILLS } from '../data/skills';
import type { AppData, ISODate, Settings, Task, TaskType } from '../types';
import { addDays, monthOf, weekday } from './dates';
import { schedulePlan } from './scheduler';

export const DEFAULT_EXAM_DATE = '2027-06-18';

const DEFAULT_EST: Record<TaskType, number> = {
  theory: 30,
  map: 25,
  calculation: 30,
  practice: 45,
  revision: 45,
};

export function defaultSettings(today: ISODate): Settings {
  return {
    examDate: DEFAULT_EXAM_DATE,
    targetGrade: 9,
    dailyMinutes: 120,
    maxTasksPerDay: 4,
    studyDays: [1, 2, 3, 4, 5, 6],
    planStart: today,
    sidebarCollapsed: false,
  };
}

export function seedTaskId(moduleId: string, code: string, i: number) {
  return `${moduleId}-${code}-${String(i + 1).padStart(2, '0')}`;
}

/** Toate taskurile din programă, încă neprogramate (cu excepția celor cu dată fixă). */
export function buildSeedTasks(): Task[] {
  const out: Task[] = [];
  let order = 0;
  for (const mod of MODULE_SEEDS) {
    for (const ch of mod.chapters) {
      ch.items.forEach((it, i) => {
        order += 10;
        out.push({
          id: seedTaskId(mod.id, ch.code, i),
          title: it.title,
          moduleId: mod.id,
          chapterId: chapterId(mod.id, ch.code),
          status: 'not_started',
          priority: it.priority ?? ch.priority ?? 'medium',
          type: it.type,
          tag: it.tag,
          plannedDate: it.date ?? null,
          deadline: it.date ?? null,
          completedDate: null,
          estimatedMin: it.est ?? DEFAULT_EST[it.type],
          actualMin: null,
          notes: '',
          custom: false,
          support: !!ch.support,
          order,
          month: it.month ?? (it.date ? monthOf(it.date) : ch.month),
          fixedDate: !!it.date,
        });
      });
    }
  }
  return out;
}

/** Recapitulări săptămânale în fiecare duminică, până la examen. */
export function buildWeeklyRevisions(from: ISODate, examDate: ISODate): Task[] {
  const out: Task[] = [];
  let d = from;
  while (weekday(d) !== 0) d = addDays(d, 1);
  let n = 0;
  for (; d < examDate; d = addDays(d, 7)) {
    n++;
    out.push({
      id: `rev-${d}`,
      title: `Recapitulare săptămânală #${n} — temele din ultimele 7 zile`,
      moduleId: 'mp',
      chapterId: WEEKLY_REVISION_CHAPTER,
      status: 'not_started',
      priority: 'medium',
      type: 'revision',
      tag: 'revision-day',
      plannedDate: d,
      deadline: d,
      completedDate: null,
      estimatedMin: 60,
      actualMin: null,
      notes: '',
      custom: false,
      support: false,
      order: 900_000 + n,
      month: monthOf(d),
      fixedDate: true,
    });
  }
  return out;
}

export function createInitialData(today: ISODate): AppData {
  const settings = defaultSettings(today);
  const tasks = [...buildSeedTasks(), ...buildWeeklyRevisions(today, settings.examDate)];
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    settings,
    tasks: schedulePlan(tasks, settings, today),
    simulations: [],
    revisions: [],
    skills: SEED_SKILLS.map((s) => ({ ...s })),
  };
}

/**
 * Adaugă taskurile noi din programă care lipsesc din datele salvate
 * (ex. după o actualizare a aplicației). Nu modifică nimic existent.
 */
export function mergeNewSeeds(data: AppData): AppData {
  const have = new Set(data.tasks.map((t) => t.id));
  const missing = buildSeedTasks().filter((t) => !have.has(t.id));
  const missingSkills = SEED_SKILLS.filter((s) => !data.skills.some((x) => x.id === s.id));
  if (!missing.length && !missingSkills.length) return data;
  return {
    ...data,
    tasks: [...data.tasks, ...missing],
    skills: [...data.skills, ...missingSkills.map((s) => ({ ...s }))],
  };
}
