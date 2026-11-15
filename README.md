# Life Organizer

Organizer personal cu mai multe aplicații: **Azi** (#/today), **BAC Geografie** (#/geo), **Obiceiuri** (#/habits),
**Jurnal & Notițe** (#/journal) și **Bibliotecă** (#/library). Pe ecranul principal: „Backup complet” = un singur fișier cu toate datele.
Ecranul principal (#/) arată toate aplicațiile. Biblioteca se salvează separat (cheia `lifeorg.library.v1`)
și are propriul export/import JSON (butoanele din pagina Bibliotecă).

## BAC Geografie 2027

Planificator personal (To-Do + Study Planner + Progress Tracker) pentru examenul de
Bacalaureat la Geografie, Republica Moldova, sesiunea iunie 2027.
Nu conține lecții — doar organizarea materiei și urmărirea progresului.

## Pornire rapidă (Windows)

**Varianta 1 — dublu-click:** deschide `start.bat`. Prima dată instalează automat
dependențele, apoi pornește aplicația și deschide browserul.

**Varianta 2 — din terminal:**

```bash
npm install      # doar prima dată
npm run dev      # pornește aplicația la http://localhost:5173
```

Necesită [Node.js](https://nodejs.org) 18 sau mai nou. Oprește serverul cu `Ctrl + C`.

## Datele tale

- Totul se salvează automat în **localStorage** (browserul de pe acest calculator).
- Rămân salvate după închiderea browserului sau repornirea calculatorului.
- Se creează automat un backup zilnic (ultimele 7 zile) — vezi **Settings**.
- **Exportă un backup JSON săptămânal** (Settings → Export) și păstrează-l separat:
  dacă ștergi datele site-urilor din browser, progresul local se pierde.
- Folosește mereu același browser și aceeași adresă (`http://localhost:5173`).

## Structura codului

```
src/
  data/        curriculum.ts (materia, verificată cu programa ANCE), skills.ts, monthPlan.ts
  lib/         progress.ts (progres), scheduler.ts (calendar), storage.ts (persistență),
               seed.ts (date inițiale), dates.ts, labels.ts
  store/       AppStore.tsx (starea aplicației + acțiuni)
  types/       tipurile TypeScript
  components/  ui/ (componente de bază), tasks/ (rând task, editare), layout/ (sidebar)
  pages/       Home (ecranul principal), Dashboard, StudyPlan, Calendar, Practice, Revision, Skills, Settings
  library/     aplicația Bibliotecă (date, căutare Open Library, pagina și panourile)
  today/ habits/ journal/   aplicațiile Azi, Obiceiuri, Jurnal & Notițe (store.tsx + pagina)
  apps.ts      registrul aplicațiilor (nume, iconiță, culoare) · lib/persist.ts salvare comună
```

Pentru a adăuga o temă în programă, editează `src/data/curriculum.ts` și adaug-o la
**finalul** capitolului (ID-urile se bazează pe poziție). Temele noi apar automat în
datele existente, fără să afecteze progresul.

## Sursa programei

„Geografie. Programă pentru examenul național de bacalaureat”, ANCE, aprobată
la 04.11.2021 — https://ance.gov.md/content/programe-de-examene
