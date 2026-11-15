/**
 * Logica de calendar: distribuie taskurile pe zilele de studiu fără a supraîncărca
 * vreo zi (limită de taskuri și de minute pe zi), respectând luna recomandată.
 */
import type { ISODate, Settings, Task } from '../types';
import { addDays, monthEnd, monthStart, weekday } from './dates';

interface DayLoad {
  count: number;
  minutes: number;
  blocked: boolean;
}

type LoadMap = Map<ISODate, DayLoad>;

function getLoad(load: LoadMap, d: ISODate): DayLoad {
  let l = load.get(d);
  if (!l) {
    l = { count: 0, minutes: 0, blocked: false };
    load.set(d, l);
  }
  return l;
}

function buildLoad(tasks: Task[], from: ISODate, exclude: Set<string>): LoadMap {
  const load: LoadMap = new Map();
  for (const t of tasks) {
    if (exclude.has(t.id) || !t.plannedDate || t.plannedDate < from) continue;
    const l = getLoad(load, t.plannedDate);
    l.count += 1;
    l.minutes += t.estimatedMin;
    // În zilele cu simulare nu se mai programează alte teme.
    if (t.tag === 'simulation') l.blocked = true;
  }
  return load;
}

const isStudyDay = (d: ISODate, s: Settings) => s.studyDays.includes(weekday(d));

function fits(load: LoadMap, d: ISODate, est: number, s: Settings, extra = 0): boolean {
  const l = load.get(d);
  if (!l) return true;
  if (l.blocked) return false;
  if (l.count === 0) return true; // o temă încape mereu
  return l.count < s.maxTasksPerDay + extra && l.minutes + est <= s.dailyMinutes + extra * 45;
}

function place(load: LoadMap, d: ISODate, est: number) {
  const l = getLoad(load, d);
  l.count += 1;
  l.minutes += est;
}

/** Termenul implicit: duminica aceleiași săptămâni (ziua de recapitulare). */
export function defaultDeadline(planned: ISODate, examDate: ISODate): ISODate {
  const limit = addDays(examDate, -1);
  const wd = weekday(planned);
  const d = addDays(planned, wd === 0 ? 0 : 7 - wd);
  if (d <= limit) return d;
  return planned > limit ? planned : limit;
}

/** Amestecă uniform elementele „extra” (competențe, practică) printre teme. */
function interleave<T>(main: T[], extras: T[]): T[] {
  if (!extras.length) return main;
  if (!main.length) return extras;
  const tagged = [
    ...main.map((v, i) => ({ v, k: (i + 1) / (main.length + 1), o: 0 })),
    ...extras.map((v, i) => ({ v, k: (i + 0.5) / extras.length, o: 1 })),
  ];
  tagged.sort((a, b) => a.k - b.k || a.o - b.o);
  return tagged.map((x) => x.v);
}

const isExtra = (t: Task) => t.moduleId === 'm7' || t.moduleId === 'mp';

/** Taskurile pe care replanificarea le poate muta. */
export const isReplannable = (t: Task) => !t.custom && !t.fixedDate && t.status !== 'completed';

/**
 * (Re)generează planificarea pentru taskurile nefinalizate din plan, începând cu `from`.
 * Taskurile finalizate, personale și cele cu dată fixă nu sunt atinse.
 */
export function schedulePlan(tasks: Task[], s: Settings, from: ISODate): Task[] {
  const lastDay = addDays(s.examDate, -1);
  if (from > lastDay) from = lastDay;

  const candidates = tasks.filter(isReplannable);
  const ids = new Set(candidates.map((t) => t.id));
  const load = buildLoad(tasks, from, ids);
  const assigned = new Map<string, ISODate>();
  const study = (d: ISODate) => isStudyDay(d, s) && !load.get(d)?.blocked;

  const nextFitting = (after: ISODate, est: number): ISODate => {
    let d = addDays(after, 1);
    while (d <= lastDay) {
      if (study(d) && fits(load, d, est, s)) return d;
      d = addDays(d, 1);
    }
    return lastDay; // fără loc: ultima zi (supraîncărcare inevitabilă)
  };

  const months = [...new Set(candidates.map((t) => t.month))].sort();
  let cursor = from;

  for (const mk of months) {
    const group = candidates.filter((t) => t.month === mk).sort((a, b) => a.order - b.order);
    const list = interleave(
      group.filter((t) => !isExtra(t)),
      group.filter(isExtra),
    );
    const start = cursor > monthStart(mk) ? cursor : monthStart(mk);
    const end = monthEnd(mk);
    const minDays = Math.ceil(list.length / Math.max(1, s.maxTasksPerDay));

    const days: ISODate[] = [];
    for (let d = start; (d <= end || days.length < minDays) && d <= lastDay; d = addDays(d, 1)) {
      if (study(d)) days.push(d);
    }
    if (!days.length) days.push(start <= lastDay ? start : lastDay);

    let prevIdx = 0;
    let lastUsed = start;
    list.forEach((task, j) => {
      let idx = Math.max(prevIdx, Math.floor((j * days.length) / list.length));
      while (idx < days.length && !fits(load, days[idx], task.estimatedMin, s)) idx++;
      if (idx >= days.length) {
        days.push(nextFitting(days[days.length - 1], task.estimatedMin));
        idx = days.length - 1;
      }
      const day = days[idx];
      place(load, day, task.estimatedMin);
      assigned.set(task.id, day);
      prevIdx = idx;
      if (day > lastUsed) lastUsed = day;
    });

    const afterMonth = addDays(end, 1);
    const afterLast = addDays(lastUsed, 1);
    cursor = afterLast > afterMonth ? afterLast : afterMonth;
  }

  return tasks.map((t) => {
    const d = assigned.get(t.id);
    return d ? { ...t, plannedDate: d, deadline: defaultDeadline(d, s.examDate) } : t;
  });
}

/**
 * Mută taskurile restante (planificate în trecut, nefinalizate) pe următoarele zile
 * de studiu, cel mult o temă în plus față de limita zilnică.
 */
export function rescheduleOverdue(
  tasks: Task[],
  s: Settings,
  today: ISODate,
): { tasks: Task[]; moved: number } {
  const overdue = tasks
    .filter((t) => t.status !== 'completed' && t.plannedDate && t.plannedDate < today)
    .sort((a, b) => a.plannedDate!.localeCompare(b.plannedDate!) || a.order - b.order);
  if (!overdue.length) return { tasks, moved: 0 };

  const ids = new Set(overdue.map((t) => t.id));
  const load = buildLoad(tasks, today, ids);
  const lastDay = addDays(s.examDate, -1);
  const assigned = new Map<string, ISODate>();
  let d = today;

  for (const t of overdue) {
    let guard = 0;
    while (
      d < lastDay &&
      guard < 400 &&
      !(isStudyDay(d, s) && fits(load, d, t.estimatedMin, s, 1))
    ) {
      d = addDays(d, 1);
      guard++;
    }
    place(load, d, t.estimatedMin);
    assigned.set(t.id, d);
  }

  return {
    moved: assigned.size,
    tasks: tasks.map((t) => {
      const nd = assigned.get(t.id);
      if (!nd) return t;
      const deadline = t.deadline && t.deadline >= nd ? t.deadline : defaultDeadline(nd, s.examDate);
      return { ...t, plannedDate: nd, deadline };
    }),
  };
}

/** Prima zi de studiu cu loc liber, după `after`. */
export function nextFreeDay(tasks: Task[], s: Settings, after: ISODate, exceptId?: string): ISODate {
  const load = buildLoad(tasks, after, new Set(exceptId ? [exceptId] : []));
  let d = addDays(after, 1);
  for (let i = 0; i < 400; i++) {
    if (isStudyDay(d, s) && fits(load, d, 30, s)) return d;
    d = addDays(d, 1);
  }
  return addDays(after, 1);
}
