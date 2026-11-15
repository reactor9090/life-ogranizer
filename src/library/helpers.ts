import type { Book, BookStatus } from './types';

export const STATUS_META: Record<BookStatus, { label: string; short: string; dot: string; pill: string }> = {
  reading: { label: 'Citesc acum', short: 'În curs', dot: 'bg-accent', pill: 'bg-accent-soft text-blue-700' },
  read: { label: 'Citite', short: 'Citită', dot: 'bg-success', pill: 'bg-green-50 text-green-700' },
  want: { label: 'Vreau să citesc', short: 'De citit', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700' },
  dropped: { label: 'Abandonate', short: 'Abandonată', dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600' },
};

export const STATUS_ORDER: BookStatus[] = ['reading', 'want', 'read', 'dropped'];

export function readingPct(b: Book): number {
  if (b.status === 'read') return 100;
  if (!b.pages) return 0;
  return Math.max(0, Math.min(100, Math.round((b.currentPage / b.pages) * 100)));
}

export function libraryStats(books: Book[], year: number) {
  const y = String(year);
  const readThisYear = books.filter((b) => b.status === 'read' && b.finishDate?.startsWith(y));
  const rated = books.filter((b) => b.rating > 0);
  return {
    total: books.length,
    reading: books.filter((b) => b.status === 'reading').length,
    read: books.filter((b) => b.status === 'read').length,
    want: books.filter((b) => b.status === 'want').length,
    readThisYear: readThisYear.length,
    pagesThisYear: readThisYear.reduce((a, b) => a + (b.pages ?? 0), 0),
    avgRating: rated.length ? rated.reduce((a, b) => a + b.rating, 0) / rated.length : 0,
  };
}

// ───────── Coperți generate (când nu există imagine) ─────────

const PALETTES: [string, string][] = [
  ['#1e3a8a', '#3b82f6'],
  ['#14532d', '#22c55e'],
  ['#7c2d12', '#f97316'],
  ['#581c87', '#a855f7'],
  ['#831843', '#ec4899'],
  ['#134e4a', '#14b8a6'],
  ['#713f12', '#eab308'],
  ['#1e293b', '#64748b'],
  ['#7f1d1d', '#ef4444'],
  ['#312e81', '#6366f1'],
];

export function coverPalette(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// ───────── Căutare cărți (Open Library, gratuit, fără cont) ─────────

export interface BookSearchResult {
  key: string;
  title: string;
  author: string;
  year: number | null;
  pages: number | null;
  coverUrl: string;
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const url =
    'https://openlibrary.org/search.json?limit=8&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year&q=' +
    encodeURIComponent(query);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Căutarea a eșuat (${res.status}).`);
  const json = (await res.json()) as { docs?: Record<string, unknown>[] };
  return (json.docs ?? []).map((d) => ({
    key: String(d.key ?? Math.random()),
    title: String(d.title ?? ''),
    author: Array.isArray(d.author_name) ? (d.author_name as string[]).slice(0, 2).join(', ') : '',
    year: typeof d.first_publish_year === 'number' ? d.first_publish_year : null,
    pages: typeof d.number_of_pages_median === 'number' ? d.number_of_pages_median : null,
    coverUrl: typeof d.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '',
  }));
}
