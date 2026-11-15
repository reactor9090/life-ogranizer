import type { ReactNode } from 'react';

/** Rândul de antet al dashboard-ului (salut + acțiuni rapide). */
export function PageHeaderless({ children }: { children: ReactNode }) {
  return <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">{children}</header>;
}
