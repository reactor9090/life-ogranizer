import type { MonthKey } from '../types';

export interface MonthPlan {
  month: MonthKey;
  title: string;
  objectives: string[];
}

export const MONTH_PLAN: MonthPlan[] = [
  {
    month: '2026-11',
    title: 'Noiembrie 2026 — Fundamente',
    objectives: [
      'Analizarea programei oficiale',
      'Familiarizarea cu structura BAC',
      'Analizarea subiectelor din 2025 și a baremului',
      'Evaluarea inițială a cunoștințelor',
      'Bazele geografiei: Pământul și reprezentarea cartografică',
      'Coordonate geografice și ora pe Glob',
      'Primele calcule geografice (Modulul 7 începe de acum)',
    ],
  },
  {
    month: '2026-12',
    title: 'Decembrie 2026 — Geografia fizică',
    objectives: [
      'Finalizarea bazelor geografice',
      'Litosfera, atmosfera, hidrosfera',
      'Biosfera și solurile',
      'Mediile geografice',
      'Localizări din curriculumul liceal (continente, Oceanul Planetar)',
      'Exerciții din subiecte anterioare',
    ],
  },
  {
    month: '2027-01',
    title: 'Ianuarie 2027 — Geografia umană',
    objectives: [
      'Harta politică și resursele naturale',
      'Populația, așezările umane, indicatori demografici',
      'Economia mondială, agricultura, industria',
      'Sectoarele economice',
    ],
  },
  {
    month: '2027-02',
    title: 'Februarie 2027 — Servicii și Europa',
    objectives: [
      'Serviciile, transporturile, comerțul internațional',
      'Relațiile economice internaționale (UE, OPEC)',
      'Caracterizarea statelor europene',
      'Localizarea statelor și capitalelor',
      'Exerciții practice',
    ],
  },
  {
    month: '2027-03',
    title: 'Martie 2027 — Extraeuropa și R. Moldova',
    objectives: [
      'Caracterizarea statelor extraeuropene',
      'Geografia Republicii Moldova',
      'Populația, economia și problemele mediului în R. Moldova',
    ],
  },
  {
    month: '2027-04',
    title: 'Aprilie 2027 — Finalizare',
    objectives: [
      'Problemele globale și dezvoltarea sustenabilă',
      'Finalizarea tuturor capitolelor',
      'Recapitularea formulelor',
      'Exerciții din toate tipurile de itemi',
      'Subiectele din anii precedenți',
    ],
  },
  {
    month: '2027-05',
    title: 'Mai 2027 — Simulări',
    objectives: [
      'Minimum un test complet pe săptămână',
      'Analizarea greșelilor',
      'Repetarea capitolelor slabe',
      'Exerciții de localizare pe hartă',
      'Încadrarea în 180 de minute',
    ],
  },
  {
    month: '2027-06',
    title: 'Iunie 2027 — Recapitulare finală',
    objectives: [
      'Recapitulare generală',
      'Formule, calcule, localizări',
      'Definiții și concepte',
      'Ultimele simulări',
      'Pregătire pentru examen',
    ],
  },
];

export const PLAN_MONTHS: MonthKey[] = MONTH_PLAN.map((x) => x.month);
