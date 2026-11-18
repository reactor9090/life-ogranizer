import type { ISODate } from '../types';

export type BookStatus = 'reading' | 'read' | 'want' | 'dropped';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  /** Numărul total de pagini (dacă e cunoscut). */
  pages: number | null;
  /** Cât am citit, în procente (0–100). */
  progress: number;
  /** 0 = fără notă, 1–5 stele. */
  rating: number;
  genre: string;
  coverUrl: string;
  startDate: ISODate | null;
  finishDate: ISODate | null;
  favorite: boolean;
  notes: string;
  addedAt: string;
  updatedAt: string;
}

export interface LibrarySettings {
  /** Câte cărți vreau să citesc anul acesta (0 = fără obiectiv). */
  yearlyGoal: number;
}

export interface LibraryData {
  version: 1;
  books: Book[];
  settings: LibrarySettings;
  updatedAt: string;
}
