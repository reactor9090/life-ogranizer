import { Heart, Star } from 'lucide-react';
import { useState } from 'react';
import { cx } from '../components/ui/primitives';
import { coverPalette } from './helpers';

/** Coperta cărții: imaginea reală sau una generată din titlu. */
export function BookCover({
  title,
  author,
  url,
  className,
  small,
}: {
  title: string;
  author?: string;
  url?: string;
  className?: string;
  small?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const [from, to] = coverPalette(title + (author ?? ''));
  const showImg = !!url && !broken;
  return (
    <div
      className={cx(
        'relative aspect-[2/3] w-full overflow-hidden rounded-md bg-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.12),0_6px_16px_-6px_rgba(15,23,42,0.25)]',
        className,
      )}
    >
      {showImg ? (
        <img src={url} alt={`Coperta: ${title}`} loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col justify-between text-white"
          style={{ background: `linear-gradient(150deg, ${to} 0%, ${from} 85%)`, padding: small ? '6px' : '12%' }}
        >
          <div className={cx('font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]', small ? 'line-clamp-4 text-[8px]' : 'line-clamp-5 text-[clamp(11px,1.1vw,15px)]')}>
            {title || 'Fără titlu'}
          </div>
          {!small && author && <div className="line-clamp-2 text-[clamp(9px,0.8vw,11px)] font-medium text-white/80">{author}</div>}
        </div>
      )}
      {/* cotorul cărții */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 via-white/10 to-transparent" />
    </div>
  );
}

export function Stars({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const dim = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  const shown = hover || value;
  return (
    <div className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)} aria-label={`${value} din 5 stele`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Star className={cx(dim, 'transition-colors', n <= shown ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300')} />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            aria-label={`${n} stele`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n === value ? 0 : n)}
            className="rounded p-0.5 hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent"
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}

export function FavoriteMark({ className }: { className?: string }) {
  return (
    <span className={cx('flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm', className)}>
      <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
    </span>
  );
}
