import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { IconButton } from './primitives';

/** Panou lateral (pe mobil: de jos). Folosit pentru editarea unui task. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-slate-900/20" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] animate-[slideUp_220ms_ease-out] flex-col rounded-t-2xl border border-line bg-white shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[440px] sm:animate-[slideLeft_220ms_ease-out] sm:rounded-none sm:rounded-l-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0 text-[15px] font-semibold text-ink">{title}</div>
          <IconButton label="Închide" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-line px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  );
}
