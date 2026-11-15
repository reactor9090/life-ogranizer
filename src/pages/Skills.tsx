import { ChevronDown, Plus, Ruler, StickyNote, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SKILL_CATEGORIES } from '../data/skills';
import { relativeDay } from '../lib/dates';
import { useStore } from '../store/AppStore';
import type { Skill, SkillCategory } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, Checkbox, IconButton, Input, ProgressBar, Select, Textarea, cx } from '../components/ui/primitives';

const LEVELS = ['Neexersat', 'Început', 'Bine', 'Stăpânit'];

export function SkillsPage() {
  const { data, addSkill } = useStore();
  const { toast } = useFeedback();
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<SkillCategory>('calc');
  const done = data.skills.filter((s) => s.done).length;
  const pct = data.skills.length ? Math.round((done / data.skills.length) * 100) : 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addSkill(title, cat);
    setTitle('');
    toast('Competență adăugată.');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Formulas & Map Skills" subtitle="Evidența competențelor practice de exersat — fără lecții, doar bifă, nivel și observații." />

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-ink">Competențe stăpânite</span>
              <span className="text-muted tabular-nums">
                {done}/{data.skills.length} · {pct}%
              </span>
            </div>
            <ProgressBar value={pct} className="mt-2" />
          </div>
          <form onSubmit={submit} className="flex gap-2 sm:w-[420px]">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Competență nouă…" aria-label="Competență nouă" className="min-w-0" />
            <Select value={cat} onChange={(e) => setCat(e.target.value as SkillCategory)} className="!w-32 shrink-0" aria-label="Categorie">
              {Object.entries(SKILL_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" />} disabled={!title.trim()} aria-label="Adaugă" />
          </form>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {(Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map((c) => {
          const skills = data.skills.filter((s) => s.category === c);
          return (
            <Card key={c} padded={false}>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Ruler className="h-4 w-4 text-muted" /> {SKILL_CATEGORIES[c]}
                </h2>
                <span className="text-xs text-muted tabular-nums">
                  {skills.filter((s) => s.done).length}/{skills.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 p-1.5">
                {skills.map((s) => (
                  <SkillRow key={s.id} skill={s} />
                ))}
                {!skills.length && <p className="px-3 py-4 text-sm text-muted">Nicio competență.</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SkillRow({ skill: s }: { skill: Skill }) {
  const { today, updateSkill, deleteSkill } = useStore();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(s.notes);

  return (
    <div className="px-2 py-2">
      <div className="flex items-start gap-2.5">
        <Checkbox
          checked={s.done}
          onChange={() => updateSkill(s.id, { done: !s.done, level: !s.done ? 3 : s.level, lastPracticed: !s.done ? today : s.lastPracticed })}
          label={s.done ? 'Marchează ca neexersat' : 'Marchează ca stăpânit'}
          className="mt-0.5"
        />
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <div className={cx('text-sm', s.done ? 'text-muted line-through decoration-slate-300' : 'text-ink')}>{s.title}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span className="flex gap-0.5" aria-label={`Nivel: ${LEVELS[s.level]}`}>
              {[1, 2, 3].map((l) => (
                <span key={l} className={cx('h-1.5 w-4 rounded-full', s.level >= l ? 'bg-accent' : 'bg-slate-200')} />
              ))}
            </span>
            {LEVELS[s.level]}
            {s.lastPracticed && <span>· exersat {relativeDay(s.lastPracticed, today)}</span>}
            {s.notes && <StickyNote className="h-3 w-3" />}
          </div>
        </button>
        <ChevronDown className={cx('mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </div>
      {open && (
        <div className="mt-3 ml-7 space-y-2.5">
          <div className="flex flex-wrap gap-1">
            {LEVELS.map((l, i) => (
              <button
                key={l}
                onClick={() => updateSkill(s.id, { level: i as Skill['level'], done: i === 3 })}
                className={cx('rounded-md px-2 py-1 text-xs font-medium', s.level === i ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {l}
              </button>
            ))}
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== s.notes && updateSkill(s.id, { notes })}
            placeholder="Observații personale: formule, greșeli frecvente, unde am exersat…"
            rows={3}
          />
          <div className="flex justify-between">
            <Button size="sm" variant="soft" onClick={() => updateSkill(s.id, { lastPracticed: today, level: Math.max(1, s.level) as Skill['level'] })}>
              Am exersat azi
            </Button>
            {s.custom && (
              <IconButton label="Șterge competența" onClick={() => deleteSkill(s.id)} className="hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
