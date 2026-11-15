import { Award, ChevronDown, ClipboardCheck, Clock, Pencil, Plus, Repeat2, Trash2, TrendingUp, X } from 'lucide-react';
import { Fragment, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { formatLong, formatMinutes, formatShort } from '../lib/dates';
import { useStore } from '../store/AppStore';
import type { Simulation } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Textarea, cx } from '../components/ui/primitives';

type Draft = {
  year: string;
  label: string;
  date: string;
  score: string;
  grade: string;
  durationMin: string;
  notes: string;
  mistakes: string;
  topicsToRepeat: string;
};

const emptyDraft = (today: string): Draft => ({
  year: '2025',
  label: '',
  date: today,
  score: '',
  grade: '',
  durationMin: '180',
  notes: '',
  mistakes: '',
  topicsToRepeat: '',
});

const toNum = (v: string, min: number, max: number) => {
  if (v.trim() === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};

export function PracticePage() {
  const { data, today, addSimulation, updateSimulation, deleteSimulation, addRevision } = useStore();
  const { toast, confirm } = useFeedback();
  const [formOpen, setFormOpen] = useState(data.simulations.length === 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(today));
  const [expanded, setExpanded] = useState<string | null>(null);

  const sims = useMemo(() => [...data.simulations].sort((a, b) => a.date.localeCompare(b.date)), [data.simulations]);
  const scored = sims.filter((s) => s.score != null);
  const best = scored.length ? Math.max(...scored.map((s) => s.score!)) : null;
  const avg = scored.length ? Math.round(scored.reduce((a, s) => a + s.score!, 0) / scored.length) : null;
  const last = scored[scored.length - 1];
  const prev = scored[scored.length - 2];
  const delta = last && prev ? last.score! - prev.score! : null;

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const startEdit = (s: Simulation) => {
    setEditing(s.id);
    setDraft({
      year: String(s.year),
      label: s.label,
      date: s.date,
      score: s.score?.toString() ?? '',
      grade: s.grade?.toString() ?? '',
      durationMin: s.durationMin?.toString() ?? '',
      notes: s.notes,
      mistakes: s.mistakes,
      topicsToRepeat: s.topicsToRepeat,
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditing(null);
    setDraft(emptyDraft(today));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const sim: Omit<Simulation, 'id'> = {
      year: Math.round(toNum(draft.year, 2000, 2100) ?? 2025),
      label: draft.label.trim(),
      date: draft.date || today,
      score: toNum(draft.score, 0, 100),
      grade: toNum(draft.grade, 1, 10),
      durationMin: toNum(draft.durationMin, 0, 600),
      notes: draft.notes,
      mistakes: draft.mistakes,
      topicsToRepeat: draft.topicsToRepeat,
    };
    if (editing) {
      updateSimulation(editing, sim);
      toast('Simulare actualizată.');
    } else {
      addSimulation(sim);
      toast('Simulare salvată.');
    }
    reset();
    setFormOpen(false);
  };

  const onDelete = async (s: Simulation) => {
    if (await confirm({ title: 'Ștergi această simulare?', text: `${s.label || `Subiect ${s.year}`} din ${formatShort(s.date)}`, confirmLabel: 'Șterge', danger: true })) {
      deleteSimulation(s.id);
      toast('Simulare ștearsă.', 'info');
    }
  };

  const sendToRevision = (s: Simulation) => {
    const topics = s.topicsToRepeat
      .split(/[\n,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!topics.length) return toast('Completează mai întâi „Teme de repetat”.', 'warn');
    topics.forEach((title) => addRevision({ title, start: today, useIntervals: true, notes: `Din simularea ${s.label || s.year} (${formatShort(s.date)})` }));
    toast(`${topics.length} ${topics.length === 1 ? 'temă adăugată' : 'teme adăugate'} la recapitulare.`);
  };

  const chartData = scored.map((s) => ({ date: s.date, label: formatShort(s.date), score: s.score, grade: s.grade, name: s.label || `Subiect ${s.year}` }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="BAC Practice"
        subtitle="Evidența subiectelor oficiale rezolvate: punctaj, timp, greșeli și teme de repetat."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            onClick={() => {
              if (formOpen) reset();
              setFormOpen((v) => !v);
            }}
          >
            {formOpen ? 'Închide formularul' : 'Înregistrează simulare'}
          </Button>
        }
      />

      {formOpen && (
        <Card>
          <CardHeader title={editing ? 'Editează simularea' : 'Simulare nouă'} subtitle="Testul BAC: 100 de puncte, 180 de minute" icon={<ClipboardCheck className="h-4 w-4" />} />
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <Field label="Anul subiectului">
                <Input type="number" min={2000} max={2100} value={draft.year} onChange={set('year')} required />
              </Field>
              <Field label="Denumire" className="col-span-2 md:col-span-1">
                <Input value={draft.label} onChange={set('label')} placeholder="ex. sesiunea de bază" />
              </Field>
              <Field label="Data rezolvării">
                <Input type="date" value={draft.date} onChange={set('date')} required />
              </Field>
              <Field label="Punctaj (0–100)">
                <Input type="number" min={0} max={100} value={draft.score} onChange={set('score')} placeholder="—" />
              </Field>
              <Field label="Nota (1–10)" hint="Conform baremului de convertire al sesiunii">
                <Input type="number" min={1} max={10} step={0.01} value={draft.grade} onChange={set('grade')} placeholder="—" />
              </Field>
              <Field label="Timp (min)">
                <Input type="number" min={0} max={600} value={draft.durationMin} onChange={set('durationMin')} />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Observații personale">
                <Textarea value={draft.notes} onChange={set('notes')} placeholder="Cum a mers, ce a durat mult…" />
              </Field>
              <Field label="Greșeli identificate">
                <Textarea value={draft.mistakes} onChange={set('mistakes')} placeholder="ex. item 9: am confundat latitudinea…" />
              </Field>
              <Field label="Teme de repetat" hint="Separă cu virgulă sau rând nou — le poți trimite la Revision.">
                <Textarea value={draft.topicsToRepeat} onChange={set('topicsToRepeat')} placeholder="Fusurile orare, climograme, OPEC" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  setFormOpen(false);
                }}
              >
                Anulează
              </Button>
              <Button variant="primary" type="submit">
                {editing ? 'Salvează modificările' : 'Salvează simularea'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={<ClipboardCheck className="h-4 w-4" />} label="Simulări" value={sims.length} />
        <MiniStat icon={<TrendingUp className="h-4 w-4" />} label="Ultimul punctaj" value={last ? `${last.score}` : '—'} sub={delta != null ? `${delta >= 0 ? '+' : ''}${delta} față de precedenta` : undefined} />
        <MiniStat icon={<Award className="h-4 w-4" />} label="Cel mai bun" value={best ?? '—'} sub={avg != null ? `medie ${avg}` : undefined} />
        <MiniStat
          icon={<Clock className="h-4 w-4" />}
          label="Timp mediu"
          value={(() => {
            const t = sims.filter((s) => s.durationMin);
            return t.length ? formatMinutes(Math.round(t.reduce((a, s) => a + s.durationMin!, 0) / t.length)) : '—';
          })()}
          sub="limita examenului: 180 min"
        />
      </div>

      <Card>
        <CardHeader title="Evoluția punctajului" subtitle="Punctaj din 100 pentru fiecare simulare, în ordinea datei" icon={<TrendingUp className="h-4 w-4" />} />
        {chartData.length < 1 ? (
          <EmptyState icon={<TrendingUp className="h-5 w-5" />} title="Încă nu ai rezultate" text="După prima simulare înregistrată, aici vei vedea evoluția." />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#EEF2F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ScoreTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card padded={false}>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <CardHeader title="Istoricul simulărilor" icon={<ClipboardCheck className="h-4 w-4" />} />
        </div>
        {sims.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="Nicio simulare înregistrată" text="Rezolvă un subiect oficial în 180 de minute și notează rezultatul." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-slate-50/70 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-2.5">Data</th>
                  <th className="px-3 py-2.5">Subiect</th>
                  <th className="px-3 py-2.5 text-right">Punctaj</th>
                  <th className="px-3 py-2.5 text-right">Nota</th>
                  <th className="px-3 py-2.5 text-right">Timp</th>
                  <th className="px-3 py-2.5">Teme de repetat</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {[...sims].reverse().map((s) => (
                  <Fragment key={s.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="px-5 py-3 whitespace-nowrap text-ink">{formatShort(s.date)} {s.date.slice(0, 4)}</td>
                      <td className="px-3 py-3 text-ink">
                        BAC {s.year}
                        {s.label && <span className="text-muted"> · {s.label}</span>}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-ink tabular-nums">{s.score ?? '—'}</td>
                      <td className="px-3 py-3 text-right text-ink tabular-nums">{s.grade ?? '—'}</td>
                      <td className={cx('px-3 py-3 text-right tabular-nums', s.durationMin && s.durationMin > 180 ? 'text-amber-700' : 'text-muted')}>
                        {s.durationMin ? formatMinutes(s.durationMin) : '—'}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-muted">{s.topicsToRepeat || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-0.5">
                          <IconButton label="Detalii" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                            <ChevronDown className={cx('h-4 w-4 transition-transform', expanded === s.id && 'rotate-180')} />
                          </IconButton>
                          <IconButton label="Trimite temele la recapitulare" onClick={() => sendToRevision(s)}>
                            <Repeat2 className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Editează" onClick={() => startEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Șterge" onClick={() => onDelete(s)} className="hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid gap-4 text-[13px] md:grid-cols-3">
                            <Detail title="Observații" text={s.notes} />
                            <Detail title="Greșeli identificate" text={s.mistakes} />
                            <Detail title="Teme de repetat" text={s.topicsToRepeat} />
                          </div>
                          <p className="mt-3 text-xs text-muted">Rezolvat: {formatLong(s.date)}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Detail({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-ink">{title}</div>
      <p className="whitespace-pre-wrap text-muted">{text || '—'}</p>
    </div>
  );
}

function MiniStat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">{icon}</span>
        {label}
      </div>
      <div className="mt-2.5 text-xl font-semibold text-ink tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </Card>
  );
}

function ScoreTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { name: string; date: string; score: number; grade: number | null };
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg shadow-slate-900/5">
      <div className="font-medium text-ink">{p.name}</div>
      <div className="mt-0.5 text-muted">{formatShort(p.date)}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-ink">
        <span className="h-2 w-2 rounded-full bg-accent" />
        Punctaj <span className="font-semibold tabular-nums">{p.score}/100</span>
      </div>
      {p.grade != null && <div className="mt-0.5 pl-3.5 text-muted">Nota {p.grade}</div>}
    </div>
  );
}
