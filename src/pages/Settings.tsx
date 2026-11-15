import { CalendarRange, Database, Download, HardDrive, History, RotateCcw, ShieldAlert, Upload, Wand2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { WEEKDAY_NAMES, diffDays, formatLong } from '../lib/dates';
import { downloadJSON, listBackups, readJSONFile } from '../lib/storage';
import { navigate } from '../hooks/useRoute';
import { useStore } from '../store/AppStore';
import { PageHeader } from '../components/layout/PageHeader';
import { useFeedback } from '../components/ui/Feedback';
import { Button, Card, CardHeader, Field, Input, cx } from '../components/ui/primitives';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SettingsPage() {
  const { data, today, updateSettings, replan, replaceAll, resetProgress, resetAll } = useStore();
  const { confirm, toast } = useFeedback();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [backups] = useState(listBackups);

  const num = (v: string, min: number, max: number, def: number) => {
    const n = Number(v);
    return Number.isFinite(n) && v !== '' ? Math.min(max, Math.max(min, n)) : def;
  };

  const toggleDay = (d: number) => {
    const next = s.studyDays.includes(d) ? s.studyDays.filter((x) => x !== d) : [...s.studyDays, d];
    if (!next.length) return toast('Păstrează cel puțin o zi de studiu.', 'warn');
    updateSettings({ studyDays: next.sort() });
  };

  const onReplan = async () => {
    const ok = await confirm({
      title: 'Regenerezi planificarea?',
      text: (
        <>
          Temele <b>nefinalizate</b> din plan vor fi redistribuite de azi până la examen, după setările curente. Temele finalizate,
          taskurile personale și simulările cu dată fixă <b>nu se schimbă</b>. Datele mutate manual la temele din plan vor fi recalculate.
        </>
      ),
      confirmLabel: 'Regenerează',
    });
    if (ok) {
      replan();
      toast('Planificarea a fost regenerată.');
    }
  };

  const onImport = async (file: File) => {
    try {
      const imported = await readJSONFile(file);
      const ok = await confirm({
        title: 'Importi datele din fișier?',
        text: `Fișierul conține ${imported.tasks.length} taskuri, ${imported.simulations.length} simulări și ${imported.revisions.length} recapitulări. Datele actuale vor fi înlocuite (exportă-le înainte, dacă vrei să le păstrezi).`,
        confirmLabel: 'Importă',
        danger: true,
      });
      if (ok) {
        replaceAll(imported);
        toast('Date importate cu succes.');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Importul a eșuat.', 'warn');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onResetProgress = async () => {
    if (
      await confirm({
        title: 'Resetezi progresul?',
        text: 'Toate bifele, statusurile și recapitulările efectuate revin la zero. Datele planificate, notele, simulările și setările rămân.',
        confirmLabel: 'Resetează progresul',
        danger: true,
      })
    ) {
      resetProgress();
      toast('Progresul a fost resetat.', 'info');
    }
  };

  const onResetAll = async () => {
    const first = await confirm({
      title: 'Ștergi TOATE datele?',
      text: 'Se pierd progresul, notele, simulările, recapitulările, taskurile personale și setările. Aplicația revine la starea inițială.',
      confirmLabel: 'Continuă',
      danger: true,
    });
    if (!first) return;
    const second = await confirm({
      title: 'Ești sigur? Acțiunea nu poate fi anulată.',
      text: 'Recomandare: descarcă mai întâi un backup JSON.',
      confirmLabel: 'Șterge definitiv',
      danger: true,
    });
    if (second) {
      resetAll();
      toast('Toate datele au fost resetate.', 'info');
      navigate('dashboard');
    }
  };

  const restore = async (i: number) => {
    const b = backups[i];
    if (await confirm({ title: 'Restaurezi acest backup automat?', text: `Salvat la ${new Date(b.savedAt).toLocaleString('ro-RO')}. Datele actuale vor fi înlocuite.`, confirmLabel: 'Restaurează', danger: true })) {
      replaceAll(b.data);
      toast('Backup restaurat.');
    }
  };

  const daysLeft = diffDays(today, s.examDate);
  const weeklyMin = s.dailyMinutes * s.studyDays.length;

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Datele se salvează automat în acest browser, pe acest calculator." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Examen și obiectiv" icon={<CalendarRange className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data examenului" hint={daysLeft >= 0 ? `${formatLong(s.examDate)} · peste ${daysLeft} zile` : 'Data a trecut'}>
              <Input type="date" value={s.examDate} onChange={(e) => e.target.value && updateSettings({ examDate: e.target.value })} />
            </Field>
            <Field label="Nota țintă" hint="Între 5 și 10">
              <Input type="number" min={5} max={10} step={0.5} value={s.targetGrade} onChange={(e) => updateSettings({ targetGrade: num(e.target.value, 5, 10, s.targetGrade) })} />
            </Field>
          </div>
          <p className="mt-3 text-xs text-muted">Conform calendarului publicat, proba la Geografie este planificată pe 18 iunie 2027. Verifică data pe ance.gov.md.</p>
        </Card>

        <Card>
          <CardHeader title="Timp de studiu" subtitle={`≈ ${Math.round(weeklyMin / 60)} ore pe săptămână`} icon={<Wand2 className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minute disponibile pe zi">
              <Input type="number" min={15} max={720} step={15} value={s.dailyMinutes} onChange={(e) => updateSettings({ dailyMinutes: num(e.target.value, 15, 720, s.dailyMinutes) })} />
            </Field>
            <Field label="Maxim teme pe zi" hint="Protejează contra zilelor supraîncărcate">
              <Input type="number" min={1} max={15} value={s.maxTasksPerDay} onChange={(e) => updateSettings({ maxTasksPerDay: num(e.target.value, 1, 15, s.maxTasksPerDay) })} />
            </Field>
          </div>
          <div className="mt-4">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Zile de studiu</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEK_ORDER.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  aria-pressed={s.studyDays.includes(d)}
                  className={cx(
                    'h-8 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
                    s.studyDays.includes(d) ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {WEEKDAY_NAMES[d].slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">Duminica are implicit doar recapitularea săptămânală.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button variant="primary" size="sm" icon={<Wand2 className="h-4 w-4" />} onClick={onReplan}>
              Regenerează planificarea
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('plan')}>
              Modifică temele și termenele
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">Schimbarea setărilor nu mută nimic automat — apasă „Regenerează” când vrei un plan nou.</p>
        </Card>

        <Card>
          <CardHeader title="Backup, export și import" icon={<Database className="h-4 w-4" />} />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => { downloadJSON(data); toast('Backup descărcat.'); }}>
              Export complet (JSON)
            </Button>
            <Button size="sm" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Import din JSON
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Recomandare: exportă un backup o dată pe săptămână și păstrează-l în cloud sau pe un stick. Datele din browser se pot pierde dacă ștergi istoricul / datele site-urilor.
          </p>
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <History className="h-4 w-4 text-muted" /> Backup-uri automate (ultimele 7 zile)
            </div>
            {backups.length ? (
              <ul className="space-y-1">
                {backups.map((b, i) => (
                  <li key={b.savedAt} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-slate-50">
                    <span className="text-ink">
                      {formatLong(b.day)} <span className="text-muted">· {new Date(b.savedAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => restore(i)}>
                      Restaurează
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">Se creează automat la prima salvare a zilei.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Resetare" icon={<ShieldAlert className="h-4 w-4" />} />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
              <div>
                <div className="text-sm font-medium text-ink">Resetează progresul</div>
                <div className="text-xs text-muted">Debifează tot; păstrează planul, notele și simulările.</div>
              </div>
              <Button size="sm" variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={onResetProgress}>
                Resetează
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/40 p-3">
              <div>
                <div className="text-sm font-medium text-ink">Șterge toate datele</div>
                <div className="text-xs text-muted">Revine la starea inițială. Cere confirmare dublă.</div>
              </div>
              <Button size="sm" variant="danger" onClick={onResetAll}>
                Șterge tot
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-muted">
            <HardDrive className="mt-px h-3.5 w-3.5 shrink-0" />
            Ultima salvare: {new Date(data.updatedAt).toLocaleString('ro-RO')} · {data.tasks.length} taskuri în total
          </div>
        </Card>
      </div>
    </div>
  );
}
