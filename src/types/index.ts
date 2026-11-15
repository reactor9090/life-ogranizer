// ───────────────────────── Tipuri de bază ─────────────────────────

export type Status = 'not_started' | 'in_progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export type TaskType = 'theory' | 'map' | 'calculation' | 'practice' | 'revision';
/** Etichete speciale folosite de calendar și statistici. */
export type TaskTag = 'simulation' | 'revision-day' | 'orientation';

/** Data în format local „YYYY-MM-DD”. */
export type ISODate = string;
/** Luna în format „YYYY-MM”. */
export type MonthKey = string;

export interface Task {
  id: string;
  title: string;
  moduleId: string;
  chapterId: string;
  status: Status;
  priority: Priority;
  type: TaskType;
  tag?: TaskTag;
  plannedDate: ISODate | null;
  deadline: ISODate | null;
  completedDate: ISODate | null;
  estimatedMin: number;
  actualMin: number | null;
  notes: string;
  /** Task adăugat de utilizator (poate fi șters). */
  custom: boolean;
  /** Temă de suport (utilă, dar nu unitate distinctă în programa oficială). */
  support: boolean;
  /** Ordinea în cadrul planului. */
  order: number;
  /** Luna recomandată în planul inițial. */
  month: MonthKey;
  /** Data fixă (simulări, zile de recapitulare) — nu e mutată de replanificare. */
  fixedDate?: boolean;
}

export interface Module {
  id: string;
  code: string;
  title: string;
  short: string;
  /** false = modul de antrenament/recapitulare, urmărit separat. */
  countsForProgress: boolean;
}

export interface Chapter {
  id: string;
  moduleId: string;
  code: string;
  title: string;
  support?: boolean;
  note?: string;
}

export interface Simulation {
  id: string;
  year: number;
  label: string;
  date: ISODate;
  score: number | null;
  grade: number | null;
  durationMin: number | null;
  notes: string;
  mistakes: string;
  topicsToRepeat: string;
}

export interface RevisionStep {
  id: string;
  dueDate: ISODate;
  doneDate: ISODate | null;
}

export interface RevisionItem {
  id: string;
  title: string;
  taskId: string | null;
  createdDate: ISODate;
  steps: RevisionStep[];
  notes: string;
}

export type SkillCategory = 'calc' | 'interpret' | 'map';

export interface Skill {
  id: string;
  title: string;
  category: SkillCategory;
  done: boolean;
  /** 0 = neexersat, 1 = început, 2 = bine, 3 = stăpânit */
  level: 0 | 1 | 2 | 3;
  notes: string;
  lastPracticed: ISODate | null;
  custom: boolean;
}

export interface Settings {
  examDate: ISODate;
  targetGrade: number;
  dailyMinutes: number;
  maxTasksPerDay: number;
  /** Zilele de studiu: 0 = duminică … 6 = sâmbătă. */
  studyDays: number[];
  planStart: ISODate;
  sidebarCollapsed: boolean;
}

export interface AppData {
  version: 1;
  createdAt: string;
  updatedAt: string;
  settings: Settings;
  tasks: Task[];
  simulations: Simulation[];
  revisions: RevisionItem[];
  skills: Skill[];
}
