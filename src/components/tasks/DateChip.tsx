import { CalendarDays } from 'lucide-react';
import { useRef } from 'react';
import { relativeDay } from '../../lib/dates';
import type { ISODate } from '../../types';
import { cx } from '../ui/primitives';

/** Chip compact care deschide selectorul nativ de dată. */
export function DateChip({
  value,
  onChange,
  today,
  tone = 'default',
  label = 'Schimbă data',
  placeholder = 'Fără dată',
  className,
}: {
  value: ISODate | null;
  onChange: (d: ISODate | null) => void;
  today: ISODate;
  tone?: 'default' | 'warn' | 'muted';
  label?: string;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };
  return (
    <span className={cx('relative inline-flex', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
        title={label}
        aria-label={`${label}: ${value ?? placeholder}`}
        className={cx(
          'inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors',
          tone === 'warn'
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            : tone === 'muted'
              ? 'text-muted hover:bg-slate-100'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        {value ? relativeDay(value, today) : placeholder}
      </button>
      <input
        ref={ref}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
    </span>
  );
}
