/** Etichete libere + dificultate — folosite de sarcinile din „Azi” și de taskurile BAC. */

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const DIFFICULTY_META: Record<Difficulty, { label: string; chip: string; dot: string }> = {
  easy: { label: 'Ușor', chip: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-500' },
  medium: { label: 'Mediu', chip: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  hard: { label: 'Greu', chip: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

export const isDifficulty = (v: unknown): v is Difficulty => DIFFICULTIES.includes(v as Difficulty);

const LABEL_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-violet-50 text-violet-700',
  'bg-pink-50 text-pink-700',
  'bg-teal-50 text-teal-700',
  'bg-orange-50 text-orange-700',
  'bg-indigo-50 text-indigo-700',
  'bg-lime-50 text-lime-700',
  'bg-cyan-50 text-cyan-700',
  'bg-rose-50 text-rose-700',
  'bg-slate-100 text-slate-700',
];

/** Culoare stabilă pentru o etichetă (aceeași etichetă = aceeași culoare peste tot). */
export function labelColor(label: string): string {
  let h = 0;
  const s = label.toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return LABEL_COLORS[h % LABEL_COLORS.length];
}

export const cleanLabel = (s: string) => s.trim().replace(/^#+/, '').replace(/\s+/g, ' ').slice(0, 24);

/** Normalizează o listă de etichete (unice, fără diferență de majuscule). */
export function normalizeLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== 'string') continue;
    const l = cleanLabel(v);
    if (l && !out.some((x) => x.toLowerCase() === l.toLowerCase())) out.push(l);
  }
  return out.slice(0, 12);
}

/** Extrage „#eticheta” din text: „Cumpără lapte #casa” → { text: „Cumpără lapte”, labels: [„casa”] }. */
export function parseHashtags(input: string): { text: string; labels: string[] } {
  const labels: string[] = [];
  const text = input
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_, sp: string, tag: string) => {
      labels.push(tag);
      return sp;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { text: text || input.trim(), labels: normalizeLabels(labels) };
}

/** Toate etichetele folosite, sortate după frecvență. */
export function allLabels(items: { labels?: string[] }[]): string[] {
  const count = new Map<string, { label: string; n: number }>();
  for (const it of items)
    for (const l of it.labels ?? []) {
      const k = l.toLowerCase();
      const c = count.get(k);
      if (c) c.n++;
      else count.set(k, { label: l, n: 1 });
    }
  return [...count.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, 'ro')).map((c) => c.label);
}

export const hasLabel = (labels: string[] | undefined, l: string) => !!labels?.some((x) => x.toLowerCase() === l.toLowerCase());
