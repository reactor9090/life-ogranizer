import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, cx } from './primitives';

// ───────── Toasts (mesaje scurte, fără ferestre pop-up) ─────────

interface Toast {
  id: number;
  text: string;
  tone: 'success' | 'info' | 'warn';
  action?: { label: string; onClick: () => void };
}

interface ConfirmOptions {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackCtx {
  toast: (text: string, tone?: Toast['tone'], action?: Toast['action']) => void;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<FeedbackCtx | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback<FeedbackCtx['toast']>((text, tone = 'success', action) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, text, tone, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3200);
  }, []);

  const confirm = useCallback<FeedbackCtx['confirm']>(
    (o) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })),
    [],
  );

  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-sm animate-[slideUp_200ms_ease-out] items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-lg shadow-slate-900/5"
          >
            {t.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            ) : t.tone === 'warn' ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-warn" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-accent" />
            )}
            <span className="min-w-0">{t.text}</span>
            {t.action && (
              <button
                className="ml-1 shrink-0 rounded-md px-2 py-0.5 text-[13px] font-semibold text-accent hover:bg-accent-soft"
                onClick={() => {
                  t.action!.onClick();
                  setToasts((all) => all.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {dialog && <ConfirmDialog {...dialog} onClose={close} />}
    </Ctx.Provider>
  );
}

function ConfirmDialog({ title, text, confirmLabel = 'Confirmă', danger, onClose }: ConfirmOptions & { onClose: (v: boolean) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-slate-900/30 backdrop-blur-[2px]" onClick={() => onClose(false)} />
      <div role="alertdialog" aria-modal className="relative w-full max-w-md animate-[scaleIn_160ms_ease-out] rounded-2xl border border-line bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', danger ? 'bg-red-50 text-red-600' : 'bg-accent-soft text-accent')}>
            {danger ? <AlertTriangle className="h-4.5 w-4.5" /> : <Info className="h-4.5 w-4.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
            {text && <div className="mt-1.5 text-sm leading-relaxed text-muted">{text}</div>}
          </div>
          <button aria-label="Închide" onClick={() => onClose(false)} className="text-slate-400 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => onClose(false)}>Anulează</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => onClose(true)} autoFocus className={danger ? '!bg-red-600 !text-white hover:!bg-red-700 !border-red-600' : ''}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useFeedback(): FeedbackCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFeedback trebuie folosit în FeedbackProvider');
  return c;
}
