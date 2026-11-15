import type { Skill, SkillCategory } from '../types';

export const SKILL_CATEGORIES: Record<SkillCategory, string> = {
  calc: 'Calcule și formule',
  interpret: 'Interpretarea suporturilor',
  map: 'Lucrul cu harta',
};

const seed: [string, string, SkillCategory][] = [
  ['sk-coord', 'Coordonate geografice', 'map'],
  ['sk-scale', 'Scara hărții', 'calc'],
  ['sk-dist', 'Calcularea distanțelor', 'calc'],
  ['sk-time', 'Fusuri orare', 'calc'],
  ['sk-temp', 'Temperatura și amplitudinea termică', 'calc'],
  ['sk-grad', 'Gradientul termic', 'calc'],
  ['sk-dens', 'Densitatea populației', 'calc'],
  ['sk-natmort', 'Natalitatea și mortalitatea', 'calc'],
  ['sk-bilant', 'Bilanțul natural', 'calc'],
  ['sk-indic', 'Indicatori demografici și economici', 'calc'],
  ['sk-clim', 'Interpretarea climogramelor', 'interpret'],
  ['sk-diag', 'Interpretarea diagramelor și graficelor', 'interpret'],
  ['sk-thematic', 'Interpretarea hărților tematice', 'interpret'],
  ['sk-locate', 'Localizarea obiectivelor geografice', 'map'],
];

export const SEED_SKILLS: Skill[] = seed.map(([id, title, category]) => ({
  id,
  title,
  category,
  done: false,
  level: 0,
  notes: '',
  lastPracticed: null,
  custom: false,
}));
