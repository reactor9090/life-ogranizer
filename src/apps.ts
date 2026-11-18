import { BookOpen, Compass, NotebookPen, Sun, type LucideIcon } from 'lucide-react';
import type { AppId } from './hooks/useRoute';

export interface AppMeta {
  id: Exclude<AppId, 'home'>;
  name: string;
  tagline: string;
  icon: LucideIcon;
  /** clase pentru iconița plină */
  solid: string;
  /** clasă pentru strălucirea de pe card */
  glow: string;
}

/** Registrul aplicațiilor — ordinea de aici e ordinea de pe ecranul principal. */
export const APPS: AppMeta[] = [
  { id: 'today', name: 'Azi', tagline: 'Priorități, sarcini și tot ce e de făcut azi', icon: Sun, solid: 'bg-orange-500 text-white', glow: 'bg-orange-200' },
  { id: 'geo', name: 'BAC Geografie', tagline: 'Plan de studiu · sesiunea iunie 2027', icon: Compass, solid: 'bg-accent text-white', glow: 'bg-blue-200' },
  { id: 'journal', name: 'Jurnal & Notițe', tagline: 'Gânduri, starea zilei și notițe', icon: NotebookPen, solid: 'bg-amber-500 text-white', glow: 'bg-amber-200' },
  { id: 'library', name: 'Bibliotecă', tagline: 'Cărțile citite, în curs și de citit', icon: BookOpen, solid: 'bg-emerald-600 text-white', glow: 'bg-emerald-200' },
];

export const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a])) as Record<AppMeta['id'], AppMeta>;
