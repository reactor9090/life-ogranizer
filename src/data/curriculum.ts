/**
 * Structura materiei — versiunea 2, după „Geografie_BAC_2027_Project_Updated.txt”
 * (curriculum optimizat pentru BAC 2027): programa ANCE aprobată prin Ordinul MEC
 * nr. 1499 din 04.11.2021, aplicabilă sesiunii 2027 conform Ordinului MEC nr. 2046
 * din 08.10.2026.
 *
 * Structura: MODUL → SUBMODUL → TASK. Modulele 1–6 = conținuturi, Modulul 7 =
 * competențe transversale (exersate din prima lună). Antrenamentul BAC (simulări,
 * recapitulări) este urmărit separat, ca să nu distorsioneze progresul materiei.
 *
 * MIGRARE: fiecare element are în `from` temele din versiunea 1 din care provine
 * (format „cod-capitol/nr”, ex. '1.2/5' = a 5-a temă din vechiul capitol 1.2).
 * La prima încărcare, progresul vechi (status, note, date) se transferă automat
 * pe temele noi — vezi `lib/migrate.ts`.
 *
 * ID-urile taskurilor sunt generate stabil (versiune-modul-capitol-index), deci NU
 * reordona elementele existente — adaugă elemente noi doar la finalul unui capitol.
 */
import type { Chapter, Module, MonthKey, Priority, TaskTag, TaskType } from '../types';

/** Versiunea structurii materiei (schimbă ID-urile taskurilor). */
export const CURRICULUM_VERSION = 2;

export interface SeedItem {
  title: string;
  type: TaskType;
  priority?: Priority;
  est?: number;
  tag?: TaskTag;
  /** Lună diferită de cea a capitolului. */
  month?: MonthKey;
  /** Dată fixă în calendar. */
  date?: string;
  /** Temele din versiunea 1 a programei din care provine (pentru migrarea progresului). */
  from?: string[];
}

export interface ChapterSeed {
  code: string;
  title: string;
  month: MonthKey;
  priority?: Priority;
  support?: boolean;
  note?: string;
  items: SeedItem[];
}

export interface ModuleSeed {
  id: string;
  code: string;
  title: string;
  short: string;
  countsForProgress?: boolean;
  chapters: ChapterSeed[];
}

type Opts = Partial<Omit<SeedItem, 'title' | 'type'>>;
/** Argumentele: obiecte cu opțiuni și/sau referințe la temele vechi ('1.2/5'). */
type Arg = Opts | string;

function mk(type: TaskType) {
  return (title: string, ...args: Arg[]): SeedItem => {
    const item: SeedItem = { title, type };
    const from: string[] = [];
    for (const a of args) {
      if (typeof a === 'string') from.push(a);
      else Object.assign(item, a);
    }
    if (from.length) item.from = [...(item.from ?? []), ...from];
    return item;
  };
}

const t = mk('theory');
const m = mk('map');
const c = mk('calculation');
const p = mk('practice');
const r = mk('revision');
const H: Opts = { priority: 'high' };
const L: Opts = { priority: 'low' };
const mo = (month: MonthKey): Opts => ({ month });

// ───────────────────────── Statele lumii ─────────────────────────

/**
 * Algoritmul de caracterizare (același pentru fiecare stat). `old` = pozițiile
 * aspectelor din vechea listă de 13 (1 = poziția EG, 2 = capitala, 3 = vecinii,
 * 4 = relieful, 5 = clima, 6 = resursele, 7 = populația, 8 = economia,
 * 9 = agricultura, 10 = industria, 11 = transporturile, 12 = comerțul, 13 = sinteza).
 */
const STATE_ASPECTS: { item: SeedItem; old: number[] }[] = [
  { item: m('Poziția geografică, capitala, vecinii și ieșirea la mare / ocean', { est: 25 }), old: [2, 3] },
  { item: t('Condiții și resurse naturale (relief, climă, ape, resurse)', { est: 35 }), old: [4, 5, 6] },
  { item: t('Populația și particularitățile demografice', { est: 25 }), old: [7] },
  { item: t('Agricultura: ramuri și specializări', { est: 25 }), old: [9] },
  { item: t('Industria: ramuri și specializări', { est: 30 }), old: [8, 10] },
  { item: t('Transporturile, serviciile și comerțul exterior', { est: 25 }), old: [11, 12] },
  { item: t('Poziția economico-geografică: avantaje și dezavantaje', { priority: 'high', est: 25 }), old: [1] },
  { item: m('Hărți tematice: statul, capitala și obiectivele geografice importante', { est: 25 }), old: [] },
  { item: p('Sinteză: particularități și comparație cu alte state', { priority: 'high', est: 30 }), old: [13] },
];

const state = (code: string, name: string, month: MonthKey, oldCode: string): ChapterSeed => ({
  code,
  title: name,
  month,
  items: STATE_ASPECTS.map(({ item, old }) => ({
    ...item,
    from: old.length ? old.map((i) => `${oldCode}/${i}`) : undefined,
  })),
});

// ───────────────────────── Modulele ─────────────────────────

export const MODULE_SEEDS: ModuleSeed[] = [
  {
    id: 'm0',
    code: '0',
    title: 'Start și orientare',
    short: 'Start',
    chapters: [
      {
        code: '0.1',
        title: 'Cunoașterea examenului',
        month: '2026-11',
        priority: 'high',
        items: [
          t('Analizează programa oficială BAC Geografie (ANCE) și ordinele pentru 2027', { est: 45 }, '0.1/1'),
          t('Structura testului: 3 domenii, 100 de puncte, 180 de minute', { est: 30 }, '0.1/2'),
          t('Pregătește cele 3 atlase școlare (clasele X, XI, XII)', { est: 15 }, '0.1/3'),
          p('Analizează subiectele BAC 2025 și baremul de corectare', { est: 60 }, '0.1/4'),
          p(
            'Evaluare inițială: rezolvă un test complet și notează rezultatul',
            { est: 180, tag: 'simulation', date: '2026-11-21' },
            '0.1/5',
          ),
        ],
      },
    ],
  },

  // ─────────── MODULUL 1 ───────────
  {
    id: 'm1',
    code: '1',
    title: 'Pământul și bazele cartografiei',
    short: 'Pământul',
    chapters: [
      {
        code: '1.1',
        title: 'Pământul – individualitate în Univers',
        month: '2026-11',
        items: [
          t('Pământul în Sistemul Solar — poziția și caracteristicile relevante', '1.1/1'),
          t('Forma, dimensiunile și proprietățile fizice ale Pământului; consecințele formei', '1.1/2', '1.1/9'),
          t('Căldura internă a Pământului și importanța ei pentru natură și societate', '1.1/8'),
          t('Gravitația terestră și importanța ei', '1.1/7'),
          t('Mișcarea de rotație: direcție, durată și consecințe geografice', H, '1.1/3'),
          t('Mișcarea de revoluție: durată, înclinarea axei și consecințe geografice', H, '1.1/4'),
          t('Ziua și noaptea, anotimpurile, solstițiile și echinocțiile', H, '1.1/5', '1.1/6'),
          p('Item BAC: Pământul și mișcările lui', { est: 25 }),
        ],
      },
      {
        code: '1.2',
        title: 'Reprezentarea cartografică a spațiului terestru',
        month: '2026-11',
        items: [
          t('Globul geografic, harta geografică și planul: caracteristici și utilizări', '1.2/1', '1.2/3'),
          t('Elementele hărții și semnele convenționale', '1.2/2'),
          t('Tipuri de hărți și alegerea hărții potrivite pentru o sarcină', '1.2/4'),
          c('Scara numerică și scara grafică', H, '1.2/5'),
          m('Orientarea pe hartă: punctele cardinale și intercardinale', '1.2/6'),
          m('Rețeaua de grade: paralele, meridiane, Ecuatorul, Greenwich, tropicele, cercurile polare', '1.2/7'),
          m('Latitudinea și longitudinea geografică', '1.2/8'),
          c('Determinarea coordonatelor geografice pe hartă', H, '1.2/9'),
          c('Desfășurarea în grade și km pe paralele / meridiane (1° de meridian ≈ 111 km)', H, '1.2/10'),
          m('Localizarea obiectivelor geografice pe suport cartografic'),
        ],
      },
      {
        code: '1.3',
        title: 'Ora pe Glob',
        month: '2026-11',
        items: [
          t('Ora locală și relația ei cu longitudinea', '1.3/1'),
          t('Ora oficială și fusurile orare', '1.3/2'),
          m('Harta fuselor orare', '1.3/3'),
          t('Linia internațională de schimbare a datei', '1.3/4'),
          c('Calcularea diferenței de timp dintre localități (15° = 1 oră)', H, '1.3/5'),
          c('Ora și data la destinație, ținând cont de direcția deplasării', H, '1.3/6'),
        ],
      },
    ],
  },

  // ─────────── MODULUL 2 ───────────
  {
    id: 'm2',
    code: '2',
    title: 'Geografia fizică generală',
    short: 'Geografie fizică',
    chapters: [
      {
        code: '2.1',
        title: 'Litosfera',
        month: '2026-12',
        items: [
          t('Structura internă a Pământului', '2.1/1'),
          t('Scoarța terestră și litosfera: deosebiri și relații', '2.1/2'),
          t('Procesele endogene', '2.1/3'),
          t('Mișcările tectonice și dinamica scoarței terestre', '2.1/4'),
          t('Vulcanismul: cauze, tipuri de manifestare și efecte', H, '2.1/5'),
          t('Cutremurele: cauze, distribuție, efecte și măsuri de protecție', H, '2.1/6'),
          t('Relieful și criteriile de clasificare a formelor de relief', '2.1/10'),
          t('Unitățile majore ale uscatului: munți, podișuri, dealuri, câmpii', '2.1/11'),
          m('Unitățile majore de relief ale uscatului — localizare pe hartă', '2.1/12'),
          t('Unitățile majore de relief ale bazinelor oceanice', '2.1/13'),
          t('Procesele exogene și agenții modelatori', '2.1/7', '2.1/8'),
          t('Relieful gravitațional și alunecările de teren', '2.1/9', '2.1/14'),
          t('Relieful torențial', '2.1/14'),
          t('Relieful fluvial', '2.1/15'),
          t('Relieful carstic', '2.1/16'),
          t('Relieful eolian', '2.1/17'),
          t('Relieful antropic', '2.1/18'),
          t('Fenomene de risc: cutremure, erupții vulcanice, alunecări de teren', H, '2.1/19'),
          t('Rolul scoarței terestre în natură și pentru societate', '2.1/20'),
          p('Item BAC: litosfera și relieful', { est: 30 }),
        ],
      },
      {
        code: '2.2',
        title: 'Atmosfera terestră',
        month: '2026-12',
        items: [
          t('Compoziția atmosferei', '2.2/1'),
          t('Structura pe verticală a atmosferei', '2.2/2'),
          t('Temperatura aerului și factorii care o influențează', '2.2/3'),
          t('Variația temperaturii aerului pe verticală', '2.2/4'),
          m('Repartiția geografică a temperaturii aerului', '2.2/6'),
          c('Amplitudinea termică — calcul', H, '2.2/7'),
          c('Gradientul termic vertical — aplicare în exerciții', H, '2.2/5'),
          t('Presiunea atmosferică și repartiția ei geografică', '2.2/8'),
          t('Vânturile: formare, direcție, tipuri și importanță', '2.2/9', '2.2/12'),
          t('Alizeele și musonii', '2.2/10', '2.2/11'),
          t('Ciclonii și anticiclonii', '2.2/13'),
          t('Precipitațiile atmosferice: formare și tipuri', '2.2/14'),
          m('Repartiția geografică a precipitațiilor', '2.2/15'),
          t('Vremea și prevederea vremii', '2.2/16'),
          t('Clima și factorii de formare a climei', '2.2/17'),
          m('Zonele climatice', H, '2.2/18'),
          t('Tipurile de climă', H, '2.2/19'),
          m('Hărțile climatice: citire și interpretare', '2.2/20'),
          c('Climograme: citire, descriere și deducerea tipului de climă', H, '2.2/21'),
          t('Fenomene de risc: ploi acide, grindină, secetă și smog', '2.2/22', '2.2/23'),
          t('Rolul atmosferei în natură și pentru societate', '2.2/24'),
          p('Item BAC: atmosfera și clima', { est: 30 }),
        ],
      },
      {
        code: '2.3',
        title: 'Hidrosfera',
        month: '2026-12',
        items: [
          t('Circulația și repartiția apei pe Glob', '2.3/1'),
          t('Componentele hidrosferei', '2.3/2'),
          m('Oceanul Planetar și principalele sale subdiviziuni', '2.3/3'),
          t('Proprietățile fizice și chimice ale apelor oceanice', '2.3/4', '2.3/5'),
          t('Râurile: izvor, curs, afluenți, confluență, vărsare', '2.3/6', '2.3/7'),
          t('Bazinele hidrografice și cumpenele de ape', '2.3/8'),
          t('Sursele de alimentare ale râurilor', '2.3/9'),
          t('Regimul de scurgere al râurilor', '2.3/10'),
          t('Importanța râurilor pentru natură și societate', '2.3/11'),
          t('Lacurile: clasificare, caracteristici generale și importanță', '2.3/12', '2.3/15', '2.3/16', '2.3/17'),
          t('Lacuri tectonice și glaciare — exemple și localizare', '2.3/13', '2.3/14'),
          t('Delte, estuare și limane', '2.3/18', '2.3/19'),
          t('Fenomene de risc: tsunami și inundații', H, '2.3/20'),
          t('Rolul hidrosferei în natură și pentru societate', '2.3/21'),
          m('Marile râuri și lacuri ale lumii — localizare', H, '2.3/22'),
          p('Item BAC: hidrosfera', { est: 30 }),
        ],
      },
      {
        code: '2.4',
        title: 'Biosfera și solul',
        month: '2026-12',
        items: [
          t('Biosfera și limitele ei generale', '2.4/1'),
          t('Solul și importanța lui', '2.4/2'),
          t('Factorii de pedogeneză', H, '2.4/3'),
          t('Principalele tipuri de sol de pe Terra', H, '2.4/4'),
          t('Relația dintre climă, sol, vegetație și faună', '2.4/6'),
          m('Distribuția zonală a vegetației și lumii animale', '2.4/5', '2.4/6'),
          t('Rolul biosferei și al solului în natură și pentru societate', '2.4/10'),
          t('Fenomene de risc: dispariția unor specii, pandemiile', '2.4/7'),
          t('Măsuri de protecție a biodiversității și solurilor', '2.4/8', '2.4/9'),
        ],
      },
      {
        code: '2.5',
        title: 'Mediile geografice',
        month: '2026-12',
        items: [
          t('Noțiunea de mediu geografic', '2.5/1'),
          t('Mediile ecuatoriale și subecuatoriale', '2.5/2', '2.5/3'),
          t('Mediile tropicale și subtropicale', '2.5/4', '2.5/5'),
          t('Mediile temperate', H, '2.5/6'),
          t('Mediile subpolare și polare', '2.5/7', '2.5/8'),
          t('Caracterizarea mediilor: climă, ape, soluri, vegetație, faună', H, '2.5/9'),
          m('Localizarea mediilor geografice pe hărți tematice', H, '2.5/10'),
          t('Relațiile dintre componentele mediului geografic'),
          p('Item BAC: biosfera, solurile și mediile geografice', { est: 30 }),
        ],
      },
    ],
  },

  // ─────────── MODULUL 3 ───────────
  {
    id: 'm3',
    code: '3',
    title: 'Geografia umană și economică a lumii',
    short: 'Geografie umană',
    chapters: [
      {
        code: '3.1',
        title: 'Harta politică a lumii',
        month: '2027-01',
        items: [
          t('Harta politică: noțiune și rol', '3.1/1'),
          t('Schimbările cantitative și calitative ale hărții politice contemporane', H, '3.1/2'),
          t('Statul și principalele sale caracteristici', '3.1/3'),
          t('Tipologia statelor lumii', '3.1/4'),
          t('State monarhii și republici', '3.1/5'),
          t('State unitare și federale', '3.1/6'),
          t('Poziția economico-geografică: noțiune, avantaje și dezavantaje', H, '3.1/7'),
          m('Localizarea statelor și capitalelor pe hărți politice', H, '3.1/8'),
        ],
      },
      {
        code: '3.2',
        title: 'Condițiile și resursele naturale',
        month: '2027-01',
        items: [
          t('Condiții naturale și resurse naturale — deosebiri', '3.2/1', '3.2/2'),
          t('Clasificarea resurselor naturale', H, '3.2/3'),
          t('Resurse extraatmosferice, ale atmosferei și agroclimatice', '3.2/5'),
          t('Resurse hidrosferice', '3.2/6'),
          t('Resurse ale litosferei: minerale, energetice și alte categorii', '3.2/7'),
          t('Resurse ale biosferei', '3.2/8'),
          t('Resurse de sol și fondul funciar', '3.2/9'),
          t('Resurse regenerabile și neregenerabile', '3.2/4'),
          m('Repartiția geografică a resurselor și rolul lor economic', '3.2/10'),
          t('Valorificarea rațională și problema epuizării resurselor'),
        ],
      },
      {
        code: '3.3',
        title: 'Populația lumii',
        month: '2027-01',
        items: [
          t('Numărul și dinamica numerică a populației', '3.3/1', '3.3/2'),
          t('Mișcarea naturală. Natalitatea și rata natalității', H, '3.3/3'),
          t('Mortalitatea și rata mortalității', H, '3.3/4'),
          t('Bilanțul natural al populației', H, '3.3/5'),
          t('Tranziția demografică și tipurile de reproducere a populației', '3.3/6', '3.3/7'),
          t('Politicile demografice', '3.3/8'),
          t('Mobilitatea teritorială: migrație, factori, tipuri și importanță', '3.3/9', '3.3/10'),
          t('Bilanțul migratoriu', '3.3/11'),
          t('Exodul de intelecte și migrația ilegală', '3.3/12', '3.3/13'),
          m('Repartiția geografică și densitatea populației', '3.3/14', '3.3/15'),
          t('Structura populației pe grupe de vârstă și pe genuri', H, '3.3/16', '3.3/17'),
          t('Speranța de viață la naștere', '3.3/18'),
          t('Structura socio-economică și resursele umane', '3.3/19'),
          t('Îmbătrânirea demografică', '3.3/20'),
          p('Interpretarea piramidelor populației și a tabelelor statistice', H, { est: 30 }),
        ],
      },
      {
        code: '3.4',
        title: 'Așezările umane și urbanizarea',
        month: '2027-01',
        items: [
          t('Așezările rurale și urbane', '3.4/1', '3.4/2'),
          t('Urbanizarea: esență, factori și consecințe', '3.4/3'),
          t('Forme de aglomerare urbană: aglomerări urbane și megalopolisuri', '3.4/4', '3.4/5'),
          t('Urbanizarea falsă', '3.4/6'),
          t('Problemele actuale ale orașelor', '3.4/7'),
          t('Relația dintre populație, așezări și activitățile economice'),
          m('Localizarea marilor orașe și megalopolisuri', '3.4/8'),
        ],
      },
      {
        code: '3.5',
        title: 'Economia mondială',
        month: '2027-01',
        items: [
          t('Economia mondială: noțiune și structură', '3.5/1', '3.5/5'),
          t('Etapele dezvoltării economice și revoluția științifico-tehnică', L, '3.5/3', '3.5/4'),
          c('Produsul Intern Brut (PIB) ca indicator economic', '3.5/2'),
          t('Structura economiei pe sectoare și ramuri', '3.5/6'),
          t('Diviziunea geografică internațională a muncii', '3.5/7'),
          t('Ramurile de specializare internațională', '3.5/8'),
          t('Integrarea economică', '3.5/9'),
        ],
      },
      {
        code: '3.6',
        title: 'Agricultura mondială',
        month: '2027-01',
        items: [
          t('Factorii dezvoltării agriculturii', '3.6/1'),
          t('Agricultura tradițională și agricultura modernă', H, '3.6/3'),
          t('Structura agriculturii pe ramuri', '3.6/2'),
          t('Cultura plantelor: subramuri, caracterizare și importanță', '3.6/4'),
          t('Cerealele și principalele regiuni de cultură', '3.6/5'),
          t('Plantele tehnice', '3.6/6'),
          t('Alte culturi: legumicultura, pomicultura, viticultura, plantele furajere', '3.6/7', '3.6/8', '3.6/9', '3.6/10'),
          t('Creșterea animalelor: subramuri, caracterizare și importanță', '3.6/11', '3.6/12'),
          m('Repartiția geografică a agriculturii', '3.6/13', '3.10/1'),
          t('Legătura dintre condițiile naturale și specializarea agricolă'),
        ],
      },
      {
        code: '3.7',
        title: 'Industria mondială',
        month: '2027-01',
        items: [
          t('Factorii de amplasare a industriei', H, '3.7/1'),
          t('Structura industriei pe ramuri și subramuri', '3.7/2'),
          t('Industria energetică: industria combustibililor', '3.7/4'),
          t('Industria energetică: energia electrică (TE, HE, AE, surse regenerabile)', '3.7/5'),
          t('Industria metalurgică', '3.7/6'),
          t('Industria constructoare de mașini și de prelucrare a metalelor', '3.7/7', '3.7/8'),
          t('Industria ușoară', '3.7/9'),
          t('Industria alimentară', '3.7/10'),
          t('Materii prime, produse finite și factori de amplasare', H, '3.7/3'),
          m('Repartiția geografică a principalelor ramuri industriale', '3.7/11', '3.10/1'),
        ],
      },
      {
        code: '3.8',
        title: 'Serviciile',
        month: '2027-02',
        items: [
          t('Sectorul serviciilor: rol și structură pe ramuri', '3.8/1', '3.8/2'),
          t('Transporturile: tipuri, rol și importanță', '3.8/4'),
          m('Marile porturi și noduri de transport', '3.10/2'),
          t('Comunicațiile', '3.8/5'),
          t('Turismul: factori de dezvoltare și clasificare', '3.8/6', '3.8/7', '3.8/8'),
          m('Marile zone turistice ale Globului', H, '3.8/9'),
          m('Obiective și destinații turistice pe hartă', '3.10/3'),
        ],
      },
      {
        code: '3.9',
        title: 'Relațiile economice internaționale',
        month: '2027-02',
        items: [
          t('Formele principale ale relațiilor economice internaționale', '3.9/1'),
          t('Comerțul internațional', '3.9/2', '3.8/3'),
          t('Exportul și importul', '3.9/3'),
          c('Balanța comercială și interpretarea ei', '3.9/3'),
          t('Integrarea economică și importanța ei', '3.9/6'),
          t('Uniunea Europeană (UE)', H, '3.9/4'),
          t('OPEC', '3.9/5'),
        ],
      },
    ],
  },

  // ─────────── MODULUL 4 ───────────
  {
    id: 'm4',
    code: '4',
    title: 'Caracterizarea economico-geografică a statelor',
    short: 'Statele lumii',
    chapters: [
      state('4.1', 'Marea Britanie', '2027-02', '4.1'),
      state('4.2', 'Franța', '2027-02', '4.2'),
      state('4.3', 'Germania', '2027-02', '4.3'),
      state('4.4', 'România', '2027-02', '4.4'),
      state('4.5', 'Ucraina', '2027-02', '4.5'),
      state('4.6', 'Rusia', '2027-02', '4.6'),
      state('4.7', 'China', '2027-03', '4.8'),
      state('4.8', 'Japonia', '2027-03', '4.9'),
      state('4.9', 'India', '2027-03', '4.10'),
      state('4.10', 'Statele Unite ale Americii (SUA)', '2027-03', '4.11'),
      state('4.11', 'Brazilia', '2027-03', '4.12'),
      state('4.12', 'Republica Africa de Sud', '2027-03', '4.13'),
      state('4.13', 'Uniunea Australiană', '2027-03', '4.14'),
      {
        code: '4.14',
        title: 'Competențe de hartă asociate modulului',
        month: '2027-02',
        priority: 'high',
        items: [
          m('Europa de Nord: state și capitale', '4.7/1'),
          m('Europa de Vest: state și capitale', '4.7/2'),
          m('Europa Centrală: state și capitale', '4.7/3'),
          m('Europa de Sud: state și capitale', '4.7/4'),
          m('Europa de Est: state și capitale', '4.7/5'),
          p('Test personal pe harta-contur a Europei', { est: 30 }, '4.7/6'),
          m('Statele extraeuropene nominalizate: capitale, vecini, poziția față de mări / oceane', mo('2027-03')),
          m('Hărți tematice: avantaje, dezavantaje și consecințe economice ale poziției', mo('2027-03')),
        ],
      },
    ],
  },

  // ─────────── MODULUL 5 ───────────
  {
    id: 'm5',
    code: '5',
    title: 'Geografia Republicii Moldova',
    short: 'R. Moldova',
    chapters: [
      {
        code: '5.1',
        title: 'Mediul geografic al Republicii Moldova',
        month: '2027-03',
        priority: 'high',
        items: [
          t('Poziția geografică a Republicii Moldova', '5.1/1'),
          t('Particularitățile mediului geografic în context european și mondial', '5.1/2'),
          t('Mediul natural, mediul antropizat și mediul antropic', '5.1/3'),
          t('Componentele abiotice, biotice și antropice', '5.1/4', '5.1/5', '5.1/6'),
          t('Relațiile dintre componentele mediului geografic'),
        ],
      },
      {
        code: '5.2',
        title: 'Relieful și substratul geologic',
        month: '2027-03',
        items: [
          t('Structura geologică și principalele tipuri de roci', '5.2/1'),
          t('Unitățile și formele majore de relief; distribuția lor spațială', '5.2/3'),
          t('Resursele minerale și valorificarea lor', '5.2/4'),
          t('Procese de risc: alunecările de teren', H, '5.8/4'),
          m('Localizarea unităților de relief și a obiectivelor geografice pe hartă', '5.2/2'),
        ],
      },
      {
        code: '5.3',
        title: 'Clima',
        month: '2027-03',
        items: [
          t('Factorii de formare a climei Republicii Moldova', '5.3/2'),
          t('Caracteristicile generale ale temperaturii aerului', '5.3/1', '5.3/3'),
          t('Repartiția temperaturilor și precipitațiilor', '5.3/3', '5.3/4'),
          t('Vânturile și masele de aer', '5.3/5'),
          t('Fenomene climatice de risc: secetă, grindină, înghețuri', '5.3/6'),
          c('Interpretarea datelor climatice și a climogramelor'),
        ],
      },
      {
        code: '5.4',
        title: 'Apele',
        month: '2027-03',
        items: [
          t('Rețeaua hidrografică a Republicii Moldova', '5.4/1'),
          t('Nistrul și Prutul: localizare și caracteristici generale', '5.4/2', '5.4/3'),
          t('Râurile mici și principalele lacuri / acumulări de apă', '5.4/4', '5.4/5'),
          t('Resursele de apă și importanța lor', '5.4/6'),
          t('Probleme privind calitatea și disponibilitatea apei'),
          m('Localizarea principalelor obiective hidrografice pe hartă', '5.4/1'),
        ],
      },
      {
        code: '5.5',
        title: 'Solurile, vegetația și fauna',
        month: '2027-03',
        items: [
          t('Principalele tipuri de sol și repartiția lor', '5.5/1'),
          t('Fertilitatea și valorificarea solurilor', '5.5/2'),
          t('Degradarea solurilor și eroziunea', '5.8/3'),
          t('Vegetația naturală și lumea animală', '5.5/3', '5.5/4'),
          t('Arii protejate și conservarea biodiversității', '5.5/5'),
        ],
      },
      {
        code: '5.6',
        title: 'Populația și așezările umane',
        month: '2027-03',
        items: [
          t('Numărul și dinamica populației', '5.6/1'),
          t('Natalitatea, mortalitatea și bilanțul natural', '5.6/2', '5.6/3'),
          t('Migrația și bilanțul migratoriu', '5.6/4'),
          t('Densitatea și repartiția teritorială a populației', '5.6/5'),
          t('Structura pe vârste și genuri', '5.6/6'),
          t('Îmbătrânirea demografică și alte probleme demografice', H, '5.6/8'),
          t('Așezările rurale și urbane'),
          t('Urbanizarea și problemele așezărilor', '5.6/7'),
          c('Interpretarea tabelelor, diagramelor și datelor statistice despre R. Moldova'),
        ],
      },
      {
        code: '5.7',
        title: 'Economia Republicii Moldova',
        month: '2027-03',
        items: [
          t('Particularitățile generale ale economiei naționale', '5.7/9'),
          t('Condiții și resurse naturale cu importanță economică', '5.7/8'),
          t('Agricultura: cultura plantelor', '5.7/1'),
          t('Agricultura: creșterea animalelor', '5.7/2'),
          t('Industria: ramuri importante și factori de amplasare', '5.7/3'),
          t('Industria alimentară și legătura cu agricultura', '5.7/5'),
          t('Energia și resursele energetice', '5.7/4'),
          t('Transporturile și poziția de tranzit', '5.7/6'),
          t('Comerțul exterior: exporturi, importuri, balanța comercială', '5.7/7'),
          m('Localizarea unor obiective economice pe hărți tematice'),
        ],
      },
      {
        code: '5.8',
        title: 'Problemele mediului în Republica Moldova',
        month: '2027-03',
        items: [
          t('Poluarea aerului și a apelor', '5.8/1', '5.8/2'),
          t('Degradarea și eroziunea solurilor', '5.8/3'),
          t('Despădurirea și degradarea vegetației', '5.8/5'),
          t('Gestionarea resurselor de apă'),
          m('Ariile naturale protejate din R. Moldova', H, '5.8/7'),
          t('Hazarduri naturale și antropice relevante pentru țară', '5.8/4'),
          t('Cauze, consecințe și măsuri de prevenire / soluționare', '5.8/6', '5.8/8'),
        ],
      },
    ],
  },

  // ─────────── MODULUL 6 ───────────
  {
    id: 'm6',
    code: '6',
    title: 'Mediul, problemele globale și dezvoltarea sustenabilă',
    short: 'Probleme globale',
    chapters: [
      {
        code: '6.1',
        title: 'Calitatea, valorificarea și protecția mediului',
        month: '2027-04',
        items: [
          t('Degradarea mediului', H, '6.1/1'),
          t('Efectul de seră', '6.1/2'),
          t('Monitoringul mediului', '6.1/3'),
          t('Patrimoniul natural și patrimoniul cultural', '6.1/4', '6.1/5'),
          t('Calitatea, valorificarea și protecția mediului aerian', '6.1/6'),
          t('Calitatea, valorificarea și protecția mediului acvatic', '6.1/7'),
          t('Protecția vegetației naturale', '6.1/8'),
          t('Protecția lumii animale', '6.1/9'),
          t('Protecția solului și subsolului', '6.1/10'),
          t('Conservarea naturii și protecția patrimoniului cultural', '6.1/11'),
          m('Ariile protejate în lume și în Republica Moldova', '6.1/12'),
        ],
      },
      {
        code: '6.2',
        title: 'Problemele globale ale lumii contemporane',
        month: '2027-04',
        note: 'Pentru fiecare problemă: cauze, repartiție, consecințe, exemple și măsuri de soluționare.',
        items: [
          t('Modificările climatice la nivel global, regional și local', H, '6.2/1'),
          t('Despădurirea', '6.2/2'),
          t('Deșertificarea', '6.2/3'),
          t('Poluarea mediului la nivel global și local', '6.2/4'),
          t('Criza energetică', '6.2/5'),
          t('Asigurarea cu resurse naturale (lume și R. Moldova)', '6.2/6'),
          t('Asigurarea cu apă potabilă (lume și R. Moldova)', '6.2/7'),
          t('Problema demografică și migrația populației (lume și R. Moldova)', '6.2/8', '6.2/9'),
          t('Problema alimentară (lume și R. Moldova)', '6.2/10'),
          t('Hazardurile naturale și antropice (lume și R. Moldova)', '6.2/11', '6.2/12'),
          p('Schemă pentru fiecare problemă: cauze, repartiție, consecințe, exemple, măsuri', H, { est: 40 }),
        ],
      },
      {
        code: '6.3',
        title: 'Dezvoltarea sustenabilă',
        month: '2027-04',
        items: [
          t('Noțiunea de dezvoltare sustenabilă', '6.3/1'),
          t('Caracteristicile generale ale dezvoltării sustenabile', '6.3/2'),
          t('Valorificarea rațională a patrimoniului natural și cultural', '6.3/3', '6.3/4', '6.3/5'),
          t('Măsuri și acțiuni de protecție și valorificare (lume și R. Moldova)', '6.3/6'),
          p('Evaluarea eficienței măsurilor propuse, cu argumente și exemple concrete', { est: 30 }),
        ],
      },
    ],
  },

  // ─────────── MODULUL 7 (transversal) ───────────
  {
    id: 'm7',
    code: '7',
    title: 'Competențe practice și antrenament BAC',
    short: 'Competențe',
    chapters: [
      {
        code: '7.1',
        title: 'Competențe cartografice',
        month: '2026-11',
        priority: 'high',
        note: 'Programa: obiectivele geografice din curriculumul liceal (cl. X–XII) sunt obligatorii.',
        items: [
          c('Determinarea coordonatelor geografice (latitudine și longitudine)', '7.1/1'),
          c('Utilizarea scării numerice și grafice', '7.1/3'),
          c('Calcularea distanțelor în linie dreaptă, pe hartă și în teren', '7.1/2'),
          c('Desfășurarea în grade și km pe paralele / meridiane, cu valorile din item', '7.1/2'),
          c('Citirea hărților fizice, politice și tematice', mo('2026-12'), '7.2/5'),
          m('Localizare: Europa — relief, râuri, lacuri, mări, peninsule', mo('2026-12'), '2.6/1'),
          m('Localizare: Asia — relief, râuri, lacuri, mări, peninsule', mo('2026-12'), '2.6/2'),
          m('Localizare: Africa — relief, râuri, lacuri', mo('2026-12'), '2.6/3'),
          m('Localizare: America de Nord și America de Sud', mo('2026-12'), '2.6/4'),
          m('Localizare: Australia, Oceania și Antarctida', mo('2026-12'), '2.6/5'),
          m('Localizare: Oceanul Planetar — mări, curenți, insule, strâmtori', mo('2026-12'), '2.6/6'),
          m('Obiectivele geografice obligatorii din curriculumul clasei a XII-a', H, mo('2027-04'), '6.3/7'),
        ],
      },
      {
        code: '7.2',
        title: 'Calcule geografice',
        month: '2026-11',
        priority: 'high',
        items: [
          c('Ora locală și diferența de timp', '7.1/4'),
          c('Schimbarea datei la traversarea liniei internaționale', '7.1/5'),
          c('Amplitudinea termică', mo('2026-12'), '7.2/1'),
          c('Gradientul termic vertical', mo('2026-12'), '7.2/2'),
          c('Densitatea populației', mo('2027-01'), '7.3/1'),
          c('Rata natalității', mo('2027-01'), '7.3/2'),
          c('Rata mortalității', mo('2027-01'), '7.3/3'),
          c('Bilanțul natural', mo('2027-01'), '7.3/4'),
          c('Indicatori demografici și economici din programă și modelele de itemi', mo('2027-01'), '7.3/5'),
          c('Diferențe dintre valori statistice; etapele calculului, cu unități și rezultat clar', mo('2027-02')),
        ],
      },
      {
        code: '7.3',
        title: 'Interpretarea suporturilor grafice și statistice',
        month: '2026-12',
        priority: 'high',
        items: [
          c('Climograme: temperaturi, precipitații, amplitudine, emisferă, tip de climă', '7.2/3'),
          c('Grafice și diagrame', mo('2027-01'), '7.3/7', '7.3/8'),
          c('Piramidele populației', mo('2027-01'), '7.3/6'),
          c('Tabele statistice', mo('2027-02'), '7.4/1'),
          c('Date despre populație, agricultură, industrie și economie', mo('2027-02')),
          c('Compararea a două regiuni, state, râuri sau fenomene după criterii', mo('2027-02'), '7.2/4', '7.4/2'),
          c('Identificarea tendințelor și formularea concluziilor pe baza datelor', mo('2027-03'), '7.4/4'),
        ],
      },
      {
        code: '7.4',
        title: 'Raționament geografic și argumentare',
        month: '2027-03',
        items: [
          c('Cauza unui fenomen și relația cauză–proces–consecință', '7.4/3'),
          c('Consecințele pentru mediu și pentru activitatea umană', '7.4/3'),
          c('Avantajele și dezavantajele unei poziții geografice', mo('2027-02')),
          c('Influența condițiilor naturale asupra activităților economice'),
          c('Propunerea unei măsuri realiste și argumentarea ei printr-un exemplu', mo('2027-04'), '7.4/5'),
          c('Răspunsuri scurte, exacte, conform verbului din cerință', mo('2027-04')),
        ],
      },
      {
        code: '7.5',
        title: 'Tipuri de itemi de antrenat',
        month: '2027-04',
        items: [
          p('Adevărat/Fals cu corectare, asocieri, completarea tabelelor și schemelor', 'P.1/6'),
          p('Localizări și coordonate; calcule cu hartă, scară, distanță și timp', 'P.1/7'),
          p('Interpretarea climogramelor, diagramelor, piramidelor și tabelelor', 'P.1/7'),
          p('Compararea după criterii, cauze și consecințe, argumentare', 'P.1/8'),
          p('Evaluarea unei situații-problemă și propunerea de soluții', 'P.1/8'),
        ],
      },
    ],
  },

  // ─────────── Antrenament (urmărit separat) ───────────
  {
    id: 'mp',
    code: 'P',
    title: 'Antrenament cu subiecte oficiale și recapitulare',
    short: 'Antrenament',
    countsForProgress: false,
    chapters: [
      {
        code: 'P.1',
        title: 'Itemi din subiectele anterioare (după fiecare temă)',
        month: '2026-12',
        note: 'Verifică după barem și clasifică greșelile: cunoștințe, hartă, calcul, interpretare, formulare, timp.',
        items: [
          p('Exerciții din subiecte anterioare: itemi de geografie fizică', 'P.1/1'),
          p('Exerciții din subiecte anterioare: calcule și climograme', 'P.1/2'),
          p('Exerciții practice: localizare pe hartă', mo('2027-02'), 'P.1/3'),
          p('Exerciții practice: itemi de geografie umană', mo('2027-02'), 'P.1/4'),
          r('Recapitularea formulelor și calculelor', mo('2027-04'), 'P.1/5'),
          p('Exerciții practice: itemi despre R. Moldova și problemele globale', mo('2027-04')),
        ],
      },
      {
        code: 'P.2',
        title: 'Simulări complete (180 de minute)',
        month: '2027-04',
        priority: 'high',
        items: [
          p('Subiectul BAC 2025 — rezolvare completă', { tag: 'simulation', est: 180, date: '2027-04-17' }, 'P.2/1'),
          p('Subiectul BAC 2026 — rezolvare completă', { tag: 'simulation', est: 180, date: '2027-04-24' }, 'P.2/2'),
          p('Simulare completă #1', { tag: 'simulation', est: 180, date: '2027-05-01' }, 'P.2/3'),
          p('Simulare completă #2', { tag: 'simulation', est: 180, date: '2027-05-08' }, 'P.2/4'),
          p('Simulare completă #3', { tag: 'simulation', est: 180, date: '2027-05-15' }, 'P.2/5'),
          p('Simulare completă #4', { tag: 'simulation', est: 180, date: '2027-05-22' }, 'P.2/6'),
          p('Simulare completă #5', { tag: 'simulation', est: 180, date: '2027-05-29' }, 'P.2/7'),
          p('Simulare finală #6', { tag: 'simulation', est: 180, date: '2027-06-05' }, 'P.2/8'),
          p('Simulare finală #7', { tag: 'simulation', est: 180, date: '2027-06-12' }, 'P.2/9'),
        ],
      },
      {
        code: 'P.3',
        title: 'Mai: greșeli și capitole slabe',
        month: '2027-05',
        items: [
          r('Analiza greșelilor din simularea #1', 'P.3/1'),
          r('Repetarea capitolelor slabe (săptămâna 1)', 'P.3/2'),
          p('Exerciții de localizare pe hartă (1)', 'P.3/3'),
          r('Analiza greșelilor din simularea #2', 'P.3/4'),
          r('Repetarea capitolelor slabe (săptămâna 2)', 'P.3/5'),
          p('Exerciții de localizare pe hartă (2)', 'P.3/6'),
          r('Analiza greșelilor din simularea #3', 'P.3/7'),
          r('Repetarea capitolelor slabe (săptămâna 3)', 'P.3/8'),
          p('Exerciții de localizare pe hartă (3)', 'P.3/9'),
          r('Analiza greșelilor din simularea #4', 'P.3/10'),
          r('Repetarea capitolelor slabe (săptămâna 4)', 'P.3/11'),
          p('Exerciții de localizare pe hartă (4)', 'P.3/12'),
          r('Analiza greșelilor din simularea #5', 'P.3/13'),
        ],
      },
      {
        code: 'P.4',
        title: 'Iunie: recapitulare generală',
        month: '2027-06',
        priority: 'high',
        items: [
          r('Recapitulare: Pământul și geografia fizică', 'P.4/1'),
          r('Recapitulare: geografia umană și economică', 'P.4/2'),
          r('Recapitulare: statele lumii', 'P.4/3'),
          r('Recapitulare: R. Moldova și problemele globale', 'P.4/4'),
          r('Recapitulare: formule și calcule', 'P.4/5'),
          r('Recapitulare: localizări geografice', 'P.4/6'),
          r('Recapitulare: definiții și concepte din programă', 'P.4/7'),
          r('Pregătire pentru examen: atlase, pix, odihnă', { date: '2027-06-17', est: 30 }, 'P.4/8'),
        ],
      },
      {
        code: 'P.5',
        title: 'Recapitulări săptămânale (duminica)',
        month: '2026-11',
        note: 'Generate automat pentru fiecare duminică — le poți muta oricând.',
        items: [],
      },
    ],
  },
];

export const WEEKLY_REVISION_CHAPTER = 'mp-P.5';

/**
 * Capitolele din versiunea 1 care au fost mutate / renumerotate — pentru taskurile
 * personale adăugate în ele. Se aplică o singură dată, la migrare.
 */
export const V1_CHAPTER_REMAP: Record<string, string> = {
  'm2-2.6': 'm7-7.1',
  'm3-3.10': 'm3-3.8',
  'm4-4.7': 'm4-4.14',
  'm4-4.8': 'm4-4.7',
  'm4-4.9': 'm4-4.8',
  'm4-4.10': 'm4-4.9',
  'm4-4.11': 'm4-4.10',
  'm4-4.12': 'm4-4.11',
  'm4-4.13': 'm4-4.12',
  'm4-4.14': 'm4-4.13',
};

// ───────────────────────── Derivate ─────────────────────────

export const MODULES: Module[] = MODULE_SEEDS.map((s) => ({
  id: s.id,
  code: s.code,
  title: s.title,
  short: s.short,
  countsForProgress: s.countsForProgress !== false,
}));

export const chapterId = (moduleId: string, code: string) => `${moduleId}-${code}`;

export const CHAPTERS: Chapter[] = MODULE_SEEDS.flatMap((s) =>
  s.chapters.map((ch) => ({
    id: chapterId(s.id, ch.code),
    moduleId: s.id,
    code: ch.code,
    title: ch.title,
    support: ch.support,
    note: ch.note,
  })),
);

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((x) => [x.id, x]));
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((x) => [x.id, x]));
