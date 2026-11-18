import { Gauge, Plus, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { DIFFICULTIES, DIFFICULTY_META, cleanLabel, hasLabel, labelColor, type Difficulty } from '../../lib/tags';
import { cx } from './primitives';

export function LabelChip({ label, onRemove, onClick, active, className }: { label: string; onRemove?: () => void; onClick?: () => void; active?: boolean; className?: string }) {
  const cls = cx(
    'inline-flex max-w-[160px] items-center gap-1 rounded-full px-2 py-px text-[11px] font-medium leading-4',
    labelColor(label),
    active && 'ring-1 ring-current',
    className,
  );
  const body = (
    <>
      <span className="opacity-60">#</span>
      <span className="truncate">{label}</span>
    </>
  );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cx(cls, 'hover:brightness-95')}>
        {body}
      </button>
    );
  return (
    <span className={cls}>
      {body}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Scoate eticheta ${label}`} className="-mr-1 rounded-full p-0.5 hover:bg-black/10">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

export function DifficultyChip({ value, className }: { value: Difficulty; className?: string }) {
  const m = DIFFICULTY_META[value];
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-px text-[11px] font-medium leading-4 ring-1 ring-inset', m.chip, className)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

/** Butoane: Fără / Ușor / Mediu / Greu. */
export function DifficultyPicker({ value, onChange, size = 'md' }: { value: Difficulty | null | undefined; onChange: (d: Difficulty | null) => void; size?: 'sm' | 'md' }) {
  const btn = size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-2.5 text-[13px]';
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Dificultate">
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        onClick={() => onChange(null)}
        className={cx('rounded-lg border font-medium transition-colors', btn, !value ? 'border-slate-300 bg-slate-100 text-ink' : 'border-line text-muted hover:text-ink')}
      >
        Fără
      </button>
      {DIFFICULTIES.map((d) => {
        const m = DIFFICULTY_META[d];
        const on = value === d;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? null : d)}
            className={cx('inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors', btn, on ? cx(m.chip, 'border-transparent ring-1 ring-inset') : 'border-line text-muted hover:text-ink')}
          >
            <span className={cx('h-2 w-2 rounded-full', m.dot)} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/** Etichetele curente + câmp pentru una nouă + sugestii din etichetele deja folosite. */
export function LabelEditor({ value, onChange, suggestions }: { value: string[]; onChange: (labels: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const l = cleanLabel(raw);
    if (!l || hasLabel(value, l)) return;
    onChange([...value, l]);
  };
  const remove = (l: string) => onChange(value.filter((x) => x !== l));
  const rest = suggestions.filter((s) => !hasLabel(value, s)).slice(0, 12);
  const submit = () => {
    add(text);
    setText('');
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((l) => (
            <LabelChip key={l} label={l} onRemove={() => remove(l)} />
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Tag className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                submit();
              } else if (e.key === 'Backspace' && !text && value.length) remove(value[value.length - 1]);
            }}
            placeholder="Etichetă nouă (ex. școală, casă)…"
            aria-label="Etichetă nouă"
            className="h-8 w-full rounded-lg border border-line bg-white pr-2 pl-8 text-[13px] text-ink placeholder:text-slate-400 focus:border-accent focus:ring-3 focus:ring-accent-soft focus:outline-none"
          />
        </div>
        <button type="button" onClick={submit} disabled={!cleanLabel(text)} aria-label="Adaugă eticheta" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-ink disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {rest.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted">Folosite:</span>
          {rest.map((l) => (
            <LabelChip key={l} label={l} onClick={() => add(l)} className="opacity-70 hover:opacity-100" />
          ))}
        </div>
      )}
    </div>
  );
}

/** Bară de filtrare: toate / o etichetă / o dificultate. */
export function TagFilter({
  labels,
  label,
  onLabel,
  difficulty,
  onDifficulty,
}: {
  labels: string[];
  label: string | null;
  onLabel: (l: string | null) => void;
  difficulty: Difficulty | null;
  onDifficulty: (d: Difficulty | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Gauge className="h-3.5 w-3.5 text-slate-400" />
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onDifficulty(difficulty === d ? null : d)}
          className={cx('rounded-full transition-opacity', difficulty && difficulty !== d && 'opacity-40', difficulty === d && 'ring-2 ring-slate-300')}
        >
          <DifficultyChip value={d} />
        </button>
      ))}
      {labels.length > 0 && <span className="mx-1 h-4 w-px bg-line" />}
      {labels.map((l) => (
        <LabelChip key={l} label={l} active={label === l} onClick={() => onLabel(label === l ? null : l)} className={cx(label && label !== l && 'opacity-40')} />
      ))}
      {(label || difficulty) && (
        <button type="button" onClick={() => { onLabel(null); onDifficulty(null); }} className="ml-1 text-[11px] font-medium text-accent hover:underline">
          Toate
        </button>
      )}
    </div>
  );
}
