import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CHAPTER_BY_ID } from '../data/curriculum';
import { SEED_SKILLS } from '../data/skills';
import { addDays, todayISO } from '../lib/dates';
import { uid } from '../lib/ids';
import { defaultDeadline, rescheduleOverdue, schedulePlan } from '../lib/scheduler';
import { buildSeedTasks, buildWeeklyRevisions, createInitialData } from '../lib/seed';
import { STORAGE_KEY, loadData, normalizeData, saveData } from '../lib/storage';
import type {
  AppData,
  ISODate,
  RevisionItem,
  Settings,
  Simulation,
  Skill,
  SkillCategory,
  Status,
  Task,
} from '../types';

/** Intervalele recomandate pentru repetare (zile după învățare). */
export const REVISION_INTERVALS = [1, 3, 7, 14, 30];

export interface NewTaskInput {
  title: string;
  chapterId: string;
  type: Task['type'];
  priority: Task['priority'];
  plannedDate: ISODate | null;
  deadline?: ISODate | null;
  estimatedMin?: number;
  notes?: string;
  labels?: string[];
  difficulty?: Task['difficulty'];
}

export interface NewRevisionInput {
  title: string;
  taskId?: string | null;
  start: ISODate;
  useIntervals: boolean;
  /** Folosit când useIntervals = false. */
  singleDate?: ISODate;
  notes?: string;
}

interface Store {
  data: AppData;
  today: ISODate;
  saveError: boolean;
  // taskuri
  toggleTask: (id: string) => void;
  setStatus: (id: string, status: Status) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  addTask: (input: NewTaskInput) => string;
  deleteTask: (id: string) => void;
  toggleChapter: (chapterId: string) => void;
  moveTask: (id: string, date: ISODate | null) => void;
  rescheduleOverdue: () => number;
  replan: () => void;
  // simulări
  addSimulation: (s: Omit<Simulation, 'id'>) => void;
  updateSimulation: (id: string, patch: Partial<Simulation>) => void;
  deleteSimulation: (id: string) => void;
  // recapitulare
  addRevision: (input: NewRevisionInput) => void;
  updateRevision: (id: string, patch: Partial<RevisionItem>) => void;
  deleteRevision: (id: string) => void;
  toggleStep: (revId: string, stepId: string) => void;
  setStepDate: (revId: string, stepId: string, date: ISODate) => void;
  addStep: (revId: string, date: ISODate) => void;
  removeStep: (revId: string, stepId: string) => void;
  // competențe
  updateSkill: (id: string, patch: Partial<Skill>) => void;
  addSkill: (title: string, category: SkillCategory) => void;
  deleteSkill: (id: string) => void;
  // setări și date
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
  resetProgress: () => void;
  resetAll: () => void;
  // UI
  editingTaskId: string | null;
  openTask: (id: string | null) => void;
}

const Ctx = createContext<Store | null>(null);

function useToday(): ISODate {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const t = setInterval(() => setToday(todayISO()), 60_000);
    return () => clearInterval(t);
  }, []);
  return today;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const [data, setData] = useState<AppData>(() => loadData() ?? createInitialData(todayISO()));
  const [saveError, setSaveError] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const latest = useRef(data);
  latest.current = data;

  // ───── Salvare automată (cu debounce) + salvare la închidere ─────
  useEffect(() => {
    const h = setTimeout(() => setSaveError(!saveData(data)), 250);
    return () => clearTimeout(h);
  }, [data]);

  useEffect(() => {
    const flush = () => saveData(latest.current);
    const onVis = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Sincronizare între taburi
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        setData(normalizeData(JSON.parse(e.newValue)));
      } catch {
        /* ignoră */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const mutate = useCallback((fn: (d: AppData) => AppData) => {
    setData((d) => ({ ...fn(d), updatedAt: new Date().toISOString() }));
  }, []);

  const mapTasks = useCallback(
    (fn: (t: Task) => Task) => mutate((d) => ({ ...d, tasks: d.tasks.map(fn) })),
    [mutate],
  );

  const withStatus = (t: Task, status: Status): Task => ({
    ...t,
    status,
    completedDate: status === 'completed' ? (t.completedDate ?? todayISO()) : null,
  });

  const store = useMemo<Store>(() => {
    const mapRevision = (id: string, fn: (r: RevisionItem) => RevisionItem) =>
      mutate((d) => ({ ...d, revisions: d.revisions.map((r) => (r.id === id ? fn(r) : r)) }));

    return {
      data,
      today,
      saveError,

      toggleTask: (id) =>
        mapTasks((t) =>
          t.id === id ? withStatus(t, t.status === 'completed' ? 'not_started' : 'completed') : t,
        ),
      setStatus: (id, status) => mapTasks((t) => (t.id === id ? withStatus(t, status) : t)),
      updateTask: (id, patch) =>
        mapTasks((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...patch };
          if (patch.status && patch.status !== t.status) return withStatus(next, patch.status);
          return next;
        }),
      addTask: (input) => {
        const id = uid('task');
        const ch = CHAPTER_BY_ID[input.chapterId];
        mutate((d) => {
          const maxOrder = Math.max(0, ...d.tasks.filter((t) => t.chapterId === input.chapterId).map((t) => t.order));
          const task: Task = {
            id,
            title: input.title.trim(),
            moduleId: ch?.moduleId ?? 'm0',
            chapterId: input.chapterId,
            status: 'not_started',
            priority: input.priority,
            type: input.type,
            plannedDate: input.plannedDate,
            deadline:
              input.deadline ?? (input.plannedDate ? defaultDeadline(input.plannedDate, d.settings.examDate) : null),
            completedDate: null,
            estimatedMin: input.estimatedMin ?? 30,
            actualMin: null,
            notes: input.notes ?? '',
            labels: input.labels ?? [],
            difficulty: input.difficulty ?? null,
            custom: true,
            support: false,
            order: maxOrder + 1,
            month: (input.plannedDate ?? todayISO()).slice(0, 7),
          };
          return { ...d, tasks: [...d.tasks, task] };
        });
        return id;
      },
      deleteTask: (id) =>
        mutate((d) => ({
          ...d,
          tasks: d.tasks.filter((t) => !(t.id === id && t.custom)),
          revisions: d.revisions.map((r) => (r.taskId === id ? { ...r, taskId: null } : r)),
        })),
      toggleChapter: (chapterId) =>
        mutate((d) => {
          const inCh = d.tasks.filter((t) => t.chapterId === chapterId);
          const allDone = inCh.length > 0 && inCh.every((t) => t.status === 'completed');
          return {
            ...d,
            tasks: d.tasks.map((t) =>
              t.chapterId === chapterId ? withStatus(t, allDone ? 'not_started' : 'completed') : t,
            ),
          };
        }),
      moveTask: (id, date) =>
        mapTasks((t) => {
          if (t.id !== id) return t;
          if (!date) return { ...t, plannedDate: null };
          // Termenul limită rămâne dacă e încă după noua dată; altfel devine duminica săptămânii noi.
          const deadline =
            t.deadline && t.deadline >= date ? t.deadline : defaultDeadline(date, data.settings.examDate);
          return { ...t, plannedDate: date, deadline, month: t.custom ? date.slice(0, 7) : t.month };
        }),
      rescheduleOverdue: () => {
        const res = rescheduleOverdue(data.tasks, data.settings, today);
        if (res.moved) mutate((d) => ({ ...d, tasks: rescheduleOverdue(d.tasks, d.settings, todayISO()).tasks }));
        return res.moved;
      },
      replan: () =>
        mutate((d) => {
          // Recapitulările săptămânale viitoare se regenerează după data examenului.
          const keep = d.tasks.filter(
            (t) => !(t.tag === 'revision-day' && t.status !== 'completed' && (t.plannedDate ?? '') >= today),
          );
          const have = new Set(keep.map((t) => t.id));
          const weekly = buildWeeklyRevisions(today, d.settings.examDate).filter((t) => !have.has(t.id));
          // Readuce eventualele taskuri din programă lipsă.
          const seeds = buildSeedTasks().filter((t) => !have.has(t.id) && !t.fixedDate);
          return { ...d, tasks: schedulePlan([...keep, ...weekly, ...seeds], d.settings, today) };
        }),

      addSimulation: (s) =>
        mutate((d) => ({ ...d, simulations: [...d.simulations, { ...s, id: uid('sim') }] })),
      updateSimulation: (id, patch) =>
        mutate((d) => ({ ...d, simulations: d.simulations.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      deleteSimulation: (id) => mutate((d) => ({ ...d, simulations: d.simulations.filter((s) => s.id !== id) })),

      addRevision: (input) =>
        mutate((d) => {
          const dates = input.useIntervals
            ? REVISION_INTERVALS.map((n) => addDays(input.start, n))
            : [input.singleDate ?? input.start];
          const item: RevisionItem = {
            id: uid('rev'),
            title: input.title.trim(),
            taskId: input.taskId ?? null,
            createdDate: todayISO(),
            steps: dates.map((dueDate) => ({ id: uid('st'), dueDate, doneDate: null })),
            notes: input.notes ?? '',
          };
          return { ...d, revisions: [item, ...d.revisions] };
        }),
      updateRevision: (id, patch) => mapRevision(id, (r) => ({ ...r, ...patch })),
      deleteRevision: (id) => mutate((d) => ({ ...d, revisions: d.revisions.filter((r) => r.id !== id) })),
      toggleStep: (revId, stepId) =>
        mapRevision(revId, (r) => ({
          ...r,
          steps: r.steps.map((s) => (s.id === stepId ? { ...s, doneDate: s.doneDate ? null : todayISO() } : s)),
        })),
      setStepDate: (revId, stepId, date) =>
        mapRevision(revId, (r) => ({
          ...r,
          steps: r.steps
            .map((s) => (s.id === stepId ? { ...s, dueDate: date } : s))
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        })),
      addStep: (revId, date) =>
        mapRevision(revId, (r) => ({
          ...r,
          steps: [...r.steps, { id: uid('st'), dueDate: date, doneDate: null }].sort((a, b) =>
            a.dueDate.localeCompare(b.dueDate),
          ),
        })),
      removeStep: (revId, stepId) =>
        mapRevision(revId, (r) => ({ ...r, steps: r.steps.filter((s) => s.id !== stepId) })),

      updateSkill: (id, patch) =>
        mutate((d) => ({ ...d, skills: d.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      addSkill: (title, category) =>
        mutate((d) => ({
          ...d,
          skills: [
            ...d.skills,
            { id: uid('sk'), title: title.trim(), category, done: false, level: 0, notes: '', lastPracticed: null, custom: true },
          ],
        })),
      deleteSkill: (id) => mutate((d) => ({ ...d, skills: d.skills.filter((s) => !(s.id === id && s.custom)) })),

      updateSettings: (patch) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      replaceAll: (next) => setData({ ...next, updatedAt: new Date().toISOString() }),
      resetProgress: () =>
        mutate((d) => ({
          ...d,
          tasks: d.tasks.map((t) => ({ ...t, status: 'not_started', completedDate: null, actualMin: null })),
          skills: d.skills.map((s) => ({ ...s, done: false, level: 0, lastPracticed: null })),
          revisions: d.revisions.map((r) => ({ ...r, steps: r.steps.map((s) => ({ ...s, doneDate: null })) })),
        })),
      resetAll: () => {
        const fresh = createInitialData(todayISO());
        fresh.skills = SEED_SKILLS.map((s) => ({ ...s }));
        setData(fresh);
      },

      editingTaskId,
      openTask: setEditingTaskId,
    };
  }, [data, today, saveError, editingTaskId, mutate, mapTasks]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore trebuie folosit în AppStoreProvider');
  return s;
}
