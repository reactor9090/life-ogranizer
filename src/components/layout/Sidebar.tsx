import {
  ArrowLeft,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  ListChecks,
  Menu,
  Repeat2,
  Ruler,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { diffDays } from '../../lib/dates';
import { countsForProgress, progressOf } from '../../lib/progress';
import { navigate, openApp, type Route } from '../../hooks/useRoute';
import { useStore } from '../../store/AppStore';
import { ProgressBar, cx } from '../ui/primitives';

export const NAV: { route: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'plan', label: 'Study Plan', icon: ListChecks },
  { route: 'calendar', label: 'Calendar', icon: CalendarDays },
  { route: 'practice', label: 'BAC Practice', icon: ClipboardCheck },
  { route: 'revision', label: 'Revision', icon: Repeat2 },
  { route: 'skills', label: 'Formulas & Map Skills', icon: Ruler },
  { route: 'settings', label: 'Settings', icon: SettingsIcon },
];

function useBadges() {
  const { data, today } = useStore();
  return useMemo(() => {
    const todayCount = data.tasks.filter((t) => t.plannedDate === today && t.status !== 'completed').length;
    const revDue = data.revisions.filter((r) => r.steps.some((s) => !s.doneDate && s.dueDate <= today)).length;
    return { plan: 0, dashboard: todayCount, revision: revDue } as Partial<Record<Route, number>>;
  }, [data, today]);
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
        <Compass className="h-4.5 w-4.5" />
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold text-ink">BAC Geografie</div>
          <div className="text-[11px] text-muted">Sesiunea iunie 2027</div>
        </div>
      )}
    </div>
  );
}

function BackToApps({ collapsed }: { collapsed?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => openApp('home')}
      title={collapsed ? 'Toate aplicațiile' : undefined}
      className={cx(
        'mb-2 flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-muted hover:bg-slate-100 hover:text-ink',
        collapsed && 'justify-center px-0',
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {!collapsed && 'Toate aplicațiile'}
    </button>
  );
}

function NavList({ route, collapsed, onPick }: { route: Route; collapsed?: boolean; onPick?: () => void }) {
  const badges = useBadges();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ route: r, label, icon: Icon }) => {
        const active = r === route;
        const badge = badges[r];
        return (
          <button
            key={r}
            type="button"
            onClick={() => {
              navigate(r);
              onPick?.();
            }}
            title={collapsed ? label : undefined}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors',
              active ? 'bg-accent-soft/70 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
            {!collapsed && <span className="truncate">{label}</span>}
            {!!badge && (
              <span
                className={cx(
                  'rounded-full bg-accent text-[10px] font-semibold text-white tabular-nums',
                  collapsed ? 'absolute top-1 right-1.5 h-2 w-2 overflow-hidden text-transparent' : 'ml-auto px-1.5 py-px',
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function MiniStatus() {
  const { data, today } = useStore();
  const p = useMemo(() => progressOf(data.tasks.filter(countsForProgress)), [data.tasks]);
  const days = Math.max(0, diffDays(today, data.settings.examDate));
  return (
    <div className="rounded-xl border border-line bg-slate-50/70 p-3">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">Progres</span>
        <span className="font-semibold text-ink tabular-nums">{p.pct}%</span>
      </div>
      <ProgressBar value={p.pct} size="sm" className="mt-1.5" />
      <div className="mt-2.5 text-xs text-muted">
        <span className="font-semibold text-ink tabular-nums">{days}</span> zile până la BAC
      </div>
    </div>
  );
}

export function Sidebar({ route }: { route: Route }) {
  const { data, updateSettings } = useStore();
  const collapsed = data.settings.sidebarCollapsed;
  return (
    <aside
      className={cx(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white/80 backdrop-blur transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[68px] px-2.5' : 'w-[248px] px-3.5',
      )}
    >
      <div className={cx('flex h-16 items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
        <Brand collapsed={collapsed} />
      </div>
      <BackToApps collapsed={collapsed} />
      <NavList route={route} collapsed={collapsed} />
      <div className="mt-auto space-y-3 pb-4">
        {!collapsed && <MiniStatus />}
        <button
          type="button"
          onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
          className={cx(
            'flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-muted hover:bg-slate-100 hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
          aria-label={collapsed ? 'Extinde meniul' : 'Restrânge meniul'}
          title={collapsed ? 'Extinde meniul' : 'Restrânge meniul'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && 'Restrânge'}
        </button>
      </div>
    </aside>
  );
}

/** Bară compactă + meniu glisant pe ecrane mici. */
export function MobileNav({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route]);
  const current = NAV.find((n) => n.route === route);
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <Brand collapsed />
        <span className="text-sm font-semibold text-ink">{current?.label}</span>
        <button
          type="button"
          aria-label="Deschide meniul"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-slate-900/25" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[280px] max-w-[85vw] animate-[slideLeft_200ms_ease-out] flex-col bg-white px-3.5 shadow-xl">
            <div className="flex h-14 items-center justify-between px-1">
              <Brand />
              <button aria-label="Închide meniul" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <BackToApps />
            <NavList route={route} onPick={() => setOpen(false)} />
            <div className="mt-auto pb-5">
              <MiniStatus />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
