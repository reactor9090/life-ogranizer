/**
 * Persistența datelor în localStorage + backup automat zilnic + export/import JSON.
 */
import type { AppData, Settings, Task } from '../types';
import { isValidISO, todayISO } from './dates';
import { defaultSettings, mergeNewSeeds } from './seed';
import { isDifficulty, normalizeLabels } from './tags';

export const STORAGE_KEY = 'bacgeo2027.data.v1';
const BACKUPS_KEY = 'bacgeo2027.backups.v1';
const MAX_BACKUPS = 7;

export interface AutoBackup {
  day: string;
  savedAt: string;
  data: AppData;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function normalizeSettings(raw: unknown): Settings {
  const d = defaultSettings(todayISO());
  if (!isObj(raw)) return d;
  const num = (v: unknown, def: number, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
  return {
    examDate: isValidISO(raw.examDate) ? raw.examDate : d.examDate,
    targetGrade: num(raw.targetGrade, d.targetGrade, 1, 10),
    dailyMinutes: num(raw.dailyMinutes, d.dailyMinutes, 15, 720),
    maxTasksPerDay: num(raw.maxTasksPerDay, d.maxTasksPerDay, 1, 15),
    studyDays:
      Array.isArray(raw.studyDays) && raw.studyDays.every((x) => typeof x === 'number')
        ? (raw.studyDays as number[])
        : d.studyDays,
    planStart: isValidISO(raw.planStart) ? raw.planStart : d.planStart,
    sidebarCollapsed: typeof raw.sidebarCollapsed === 'boolean' ? raw.sidebarCollapsed : false,
  };
}

function normalizeTask(t: Record<string, unknown>): Task | null {
  if (typeof t.id !== 'string' || typeof t.title !== 'string') return null;
  const s = (v: unknown, def = '') => (typeof v === 'string' ? v : def);
  const date = (v: unknown) => (isValidISO(v) ? v : null);
  const status = ['not_started', 'in_progress', 'completed'].includes(t.status as string)
    ? (t.status as Task['status'])
    : 'not_started';
  return {
    id: t.id,
    title: t.title,
    moduleId: s(t.moduleId, 'm0'),
    chapterId: s(t.chapterId, 'm0-0.1'),
    status,
    priority: (['low', 'medium', 'high'].includes(t.priority as string) ? t.priority : 'medium') as Task['priority'],
    type: (['theory', 'map', 'calculation', 'practice', 'revision'].includes(t.type as string)
      ? t.type
      : 'theory') as Task['type'],
    tag: (['simulation', 'revision-day', 'orientation'].includes(t.tag as string) ? t.tag : undefined) as Task['tag'],
    plannedDate: date(t.plannedDate),
    deadline: date(t.deadline),
    completedDate: date(t.completedDate),
    estimatedMin: typeof t.estimatedMin === 'number' ? t.estimatedMin : 30,
    actualMin: typeof t.actualMin === 'number' ? t.actualMin : null,
    notes: s(t.notes),
    custom: !!t.custom,
    support: !!t.support,
    order: typeof t.order === 'number' ? t.order : 0,
    month: s(t.month, '2026-11'),
    fixedDate: !!t.fixedDate,
    labels: normalizeLabels(t.labels),
    difficulty: isDifficulty(t.difficulty) ? t.difficulty : null,
  };
}

/** Validează și completează un obiect necunoscut (din localStorage sau import). */
export function normalizeData(raw: unknown): AppData {
  if (!isObj(raw) || !Array.isArray(raw.tasks)) {
    throw new Error('Fișierul nu conține date valide ale aplicației (lipsește lista de taskuri).');
  }
  const tasks = raw.tasks.filter(isObj).map(normalizeTask).filter((t): t is Task => !!t);
  const now = new Date().toISOString();
  const data: AppData = {
    version: 1,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    settings: normalizeSettings(raw.settings),
    tasks,
    simulations: Array.isArray(raw.simulations) ? (raw.simulations.filter(isObj) as unknown as AppData['simulations']) : [],
    revisions: Array.isArray(raw.revisions)
      ? (raw.revisions.filter(isObj) as unknown as AppData['revisions']).map((r) => ({
          ...r,
          steps: Array.isArray(r.steps) ? r.steps : [],
          notes: r.notes ?? '',
        }))
      : [],
    skills: Array.isArray(raw.skills) ? (raw.skills.filter(isObj) as unknown as AppData['skills']) : [],
  };
  return mergeNewSeeds(data);
}

export function loadData(): AppData | null {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeData(JSON.parse(raw));
  } catch (e) {
    console.error('Datele salvate nu au putut fi citite', e);
    // Păstrează o copie a datelor corupte, ca să nu se piardă nimic.
    safeSet(`${STORAGE_KEY}.corrupt.${Date.now()}`, raw);
    return null;
  }
}

export function saveData(data: AppData): boolean {
  const ok = safeSet(STORAGE_KEY, JSON.stringify(data));
  if (ok) maybeAutoBackup(data);
  return ok;
}

// ───────── Backup automat zilnic (ultimele 7 zile) ─────────

export function listBackups(): AutoBackup[] {
  try {
    const arr = JSON.parse(safeGet(BACKUPS_KEY) ?? '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function maybeAutoBackup(data: AppData) {
  const day = todayISO();
  const list = listBackups();
  if (list[0]?.day === day) {
    list[0] = { day, savedAt: new Date().toISOString(), data };
  } else {
    list.unshift({ day, savedAt: new Date().toISOString(), data });
  }
  safeSet(BACKUPS_KEY, JSON.stringify(list.slice(0, MAX_BACKUPS)));
}

// ───────── Export / import ─────────

export function downloadJSON(data: AppData, name = `bac-geografie-backup-${todayISO()}.json`) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readJSONFile(file: File): Promise<AppData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Fișierul nu este un JSON valid.');
  }
  return normalizeData(parsed);
}
