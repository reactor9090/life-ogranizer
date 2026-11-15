import type { Priority, Status, TaskType } from '../types';

export const STATUS_LABEL: Record<Status, string> = {
  not_started: 'Neînceput',
  in_progress: 'În desfășurare',
  completed: 'Finalizat',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Scăzută',
  medium: 'Medie',
  high: 'Ridicată',
};

export const TYPE_LABEL: Record<TaskType, string> = {
  theory: 'Teorie',
  map: 'Hartă',
  calculation: 'Calcul',
  practice: 'Practică BAC',
  revision: 'Recapitulare',
};

/** Culori discrete pentru tipurile de task (fundal / text / punct). */
export const TYPE_STYLE: Record<TaskType, { dot: string; chip: string; bar: string }> = {
  theory: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700', bar: 'border-l-blue-500' },
  map: { dot: 'bg-teal-500', chip: 'bg-teal-50 text-teal-700', bar: 'border-l-teal-500' },
  calculation: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700', bar: 'border-l-violet-500' },
  practice: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700', bar: 'border-l-amber-500' },
  revision: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700', bar: 'border-l-emerald-500' },
};

export const PRIORITY_STYLE: Record<Priority, string> = {
  low: 'text-slate-500 bg-slate-100',
  medium: 'text-blue-700 bg-blue-50',
  high: 'text-orange-700 bg-orange-50',
};

export const TASK_TYPES: TaskType[] = ['theory', 'map', 'calculation', 'practice', 'revision'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
export const STATUSES: Status[] = ['not_started', 'in_progress', 'completed'];
