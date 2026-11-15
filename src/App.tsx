import { AlertTriangle, ArrowLeft, LayoutGrid } from 'lucide-react';
import type { ReactNode } from 'react';
import { APPS, APP_BY_ID, type AppMeta } from './apps';
import { MobileNav, Sidebar } from './components/layout/Sidebar';
import { TaskDrawer } from './components/tasks/TaskDrawer';
import { FeedbackProvider } from './components/ui/Feedback';
import { cx } from './components/ui/primitives';
import { HabitsPage } from './habits/HabitsPage';
import { HabitsProvider, useHabits } from './habits/store';
import { openApp, useLocation, type Route } from './hooks/useRoute';
import { JournalPage } from './journal/JournalPage';
import { JournalProvider, useJournal } from './journal/store';
import { LibraryPage } from './library/LibraryPage';
import { LibraryProvider, useLibrary } from './library/LibraryStore';
import { CalendarPage } from './pages/Calendar';
import { Dashboard } from './pages/Dashboard';
import { HomePage } from './pages/Home';
import { PracticePage } from './pages/Practice';
import { RevisionPage } from './pages/Revision';
import { SettingsPage } from './pages/Settings';
import { SkillsPage } from './pages/Skills';
import { StudyPlan } from './pages/StudyPlan';
import { AppStoreProvider, useStore } from './store/AppStore';
import { TodayProvider, useToday } from './today/store';
import { TodayPage } from './today/TodayPage';

const GEO_PAGES: Record<Route, () => JSX.Element> = {
  dashboard: Dashboard,
  plan: StudyPlan,
  calendar: CalendarPage,
  practice: PracticePage,
  revision: RevisionPage,
  skills: SkillsPage,
  settings: SettingsPage,
};

function SaveWarning({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[13px] text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {text}
    </div>
  );
}

/** Aplicația BAC Geografie — exact cum era, cu meniul lateral. */
function GeoApp({ page }: { page: Route }) {
  const { saveError } = useStore();
  const Page = GEO_PAGES[page];
  return (
    <div className="flex min-h-dvh">
      <Sidebar route={page} />
      <div className="min-w-0 flex-1">
        <MobileNav route={page} />
        {saveError && <SaveWarning text="Datele nu au putut fi salvate în browser (spațiu plin sau mod privat). Fă un export JSON din Settings." />}
        <main key={page} className="mx-auto w-full max-w-[1240px] animate-[pageIn_220ms_ease-out] px-4 pt-5 pb-16 sm:px-6 lg:px-8 lg:pt-8">
          <Page />
        </main>
      </div>
      <TaskDrawer />
    </div>
  );
}

/** Cadrul comun pentru celelalte aplicații: bară sus + comutare rapidă între aplicații. */
function AppFrame({ app, saveError, children }: { app: AppMeta; saveError?: boolean; children: ReactNode }) {
  const Icon = app.icon;
  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => openApp('home')}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted hover:bg-slate-100 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Toate aplicațiile</span>
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 md:flex-none">
            <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', app.solid)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-semibold text-ink">{app.name}</span>
          </div>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Aplicații">
            {APPS.map((a) => {
              const I = a.icon;
              const on = a.id === app.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openApp(a.id)}
                  title={a.name}
                  aria-current={on ? 'page' : undefined}
                  className={cx('inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors', on ? 'bg-slate-100 text-ink' : 'text-muted hover:bg-slate-50 hover:text-ink')}
                >
                  <I className="h-4 w-4" />
                  <span className="hidden xl:inline">{a.name}</span>
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => openApp('home')}
            aria-label="Ecranul principal"
            title="Ecranul principal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-ink md:hidden"
          >
            <LayoutGrid className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
      {saveError && <SaveWarning text="Datele nu au putut fi salvate în browser (spațiu plin sau mod privat). Fă un backup complet de pe ecranul principal." />}
      <main className="mx-auto w-full max-w-[1240px] animate-[pageIn_220ms_ease-out] px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
    </div>
  );
}

function Shell() {
  const loc = useLocation();
  const lib = useLibrary();
  const habits = useHabits();
  const journal = useJournal();
  const today = useToday();
  const geo = useStore();

  switch (loc.app) {
    case 'geo':
      return <GeoApp page={loc.page} />;
    case 'library':
      return (
        <AppFrame app={APP_BY_ID.library} saveError={lib.saveError}>
          <LibraryPage />
        </AppFrame>
      );
    case 'habits':
      return (
        <AppFrame app={APP_BY_ID.habits} saveError={habits.saveError}>
          <HabitsPage />
        </AppFrame>
      );
    case 'journal':
      return (
        <AppFrame app={APP_BY_ID.journal} saveError={journal.saveError}>
          <JournalPage tab={loc.tab} />
        </AppFrame>
      );
    case 'today':
      return (
        <AppFrame app={APP_BY_ID.today} saveError={today.saveError || habits.saveError || journal.saveError || geo.saveError}>
          <TodayPage />
        </AppFrame>
      );
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <AppStoreProvider>
      <LibraryProvider>
        <HabitsProvider>
          <JournalProvider>
            <TodayProvider>
              <FeedbackProvider>
                <Shell />
              </FeedbackProvider>
            </TodayProvider>
          </JournalProvider>
        </HabitsProvider>
      </LibraryProvider>
    </AppStoreProvider>
  );
}
