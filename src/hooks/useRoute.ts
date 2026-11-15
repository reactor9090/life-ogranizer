import { useEffect, useState } from 'react';

/** Paginile aplicației „BAC Geografie”. */
export type Route = 'dashboard' | 'plan' | 'calendar' | 'practice' | 'revision' | 'skills' | 'settings';

/** Aplicațiile din organizer. */
export type AppId = 'home' | 'today' | 'geo' | 'habits' | 'journal' | 'library';

export type Location =
  | { app: 'home' }
  | { app: 'geo'; page: Route }
  | { app: 'journal'; tab: 'journal' | 'notes' }
  | { app: 'today' | 'habits' | 'library' };

const GEO_ROUTES: Route[] = ['dashboard', 'plan', 'calendar', 'practice', 'revision', 'skills', 'settings'];
const isGeo = (s: string | undefined): s is Route => !!s && (GEO_ROUTES as string[]).includes(s);

function parse(): Location {
  const parts = window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  const [a, b] = parts;
  if (a === 'geo') return { app: 'geo', page: isGeo(b) ? b : 'dashboard' };
  if (a === 'library' || a === 'today' || a === 'habits') return { app: a };
  if (a === 'journal') return { app: 'journal', tab: b === 'notes' ? 'notes' : 'journal' };
  // Linkuri vechi (#/plan, #/calendar…) — duc tot în BAC Geografie.
  if (isGeo(a)) return { app: 'geo', page: a };
  return { app: 'home' };
}

/** Navigare în interiorul aplicației BAC Geografie. */
export function navigate(r: Route) {
  window.location.hash = r === 'dashboard' ? '/geo' : `/geo/${r}`;
}

/** Deschide o aplicație din organizer (sau ecranul principal). */
export function openApp(app: AppId) {
  window.location.hash = app === 'home' ? '/' : `/${app}`;
}

/** Router minimal pe hash — pagina curentă rămâne la refresh. */
export function useLocation(): Location {
  const [loc, setLoc] = useState<Location>(parse);
  useEffect(() => {
    const on = () => {
      setLoc(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return loc;
}
