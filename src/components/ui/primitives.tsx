import { Check, Minus } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ───────── Card ─────────

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cx(
        'min-w-0 rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        padded && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 text-muted">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ───────── Button ─────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}) {
  const styles: Record<Variant, string> = {
    primary: 'bg-accent text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-white text-ink border border-line hover:bg-slate-50',
    ghost: 'text-muted hover:text-ink hover:bg-slate-100',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    soft: 'bg-accent-soft text-blue-700 hover:bg-blue-100',
  };
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
        styles[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors',
        'hover:bg-slate-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ───────── Progress ─────────

export function ProgressBar({
  value,
  className,
  tone = 'accent',
  size = 'md',
}: {
  value: number;
  className?: string;
  tone?: 'accent' | 'success' | 'warn';
  size?: 'sm' | 'md' | 'lg';
}) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 100 ? 'bg-success' : tone === 'warn' ? 'bg-warn' : tone === 'success' ? 'bg-success' : 'bg-accent';
  const h = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  return (
    <div
      className={cx('w-full overflow-hidden rounded-full bg-slate-100', h, className)}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cx('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={v >= 100 ? '#16A34A' : '#2563EB'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (v / 100) * c}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

// ───────── Checkbox ─────────

export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate,
  size = 'md',
  className,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  indeterminate?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const dim = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cx(
        'group relative inline-flex shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        // zonă de atingere mai mare pe mobil
        'before:absolute before:-inset-2.5 before:content-[""]',
        dim,
        checked
          ? 'border-success bg-success text-white'
          : indeterminate
            ? 'border-accent bg-accent text-white'
            : 'border-slate-300 bg-white hover:border-accent',
        className,
      )}
    >
      {checked ? (
        <Check className="h-3 w-3 animate-[pop_160ms_ease-out]" strokeWidth={3.5} />
      ) : indeterminate ? (
        <Minus className="h-3 w-3" strokeWidth={3.5} />
      ) : null}
    </button>
  );
}

// ───────── Badges ─────────

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
        className ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {children}
    </span>
  );
}

// ───────── Segmented control ─────────

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div className={cx('inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-0.5 no-scrollbar', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all',
            size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
            value === o.value ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={cx('tabular-nums', value === o.value ? 'text-muted' : 'text-slate-400')}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ───────── Form fields ─────────

const fieldBase =
  'w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-slate-400 transition-colors ' +
  'focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-soft disabled:bg-slate-50';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldBase, 'h-9', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'h-9 pr-8 appearance-none bg-[url(/chevron.svg)] bg-[length:16px] bg-[right_8px_center] bg-no-repeat', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, 'min-h-20 py-2 leading-relaxed', className)} {...rest} />;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// ───────── Empty state ─────────

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-muted">{icon}</div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[13px] text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
