/**
 * Structura materiei — verificată cu „Geografie. Programă pentru examenul național
 * de bacalaureat” (ANCE, aprobată 04.11.2021), document în vigoare pentru BAC 2027.
 *
 * Elementele marcate cu `// [programă]` au fost adăugate pentru că apar în programa
 * oficială, dar lipseau din lista inițială. Capitolele cu `support: true` nu sunt
 * unități distincte în programă, dar sunt utile pentru argumentare (ex. R. Moldova).
 *
 * ID-urile taskurilor sunt generate stabil (modul-capitol-index), deci NU reordona
 * elementele existente — adaugă elemente noi doar la finalul unui capitol.
 */
import type { Chapter, Module, MonthKey, Priority, TaskTag, TaskType } from '../types';

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
const t = (title: string, o: Opts = {}): SeedItem => ({ title, type: 'theory', ...o });
const m = (title: string, o: Opts = {}): SeedItem => ({ title, type: 'map', ...o });
const c = (title: string, o: Opts = {}): SeedItem => ({ title, type: 'calculation', ...o });
const p = (title: string, o: Opts = {}): SeedItem => ({ title, type: 'practice', ...o });
const r = (title: string, o: Opts = {}): SeedItem => ({ title, type: 'revision', ...o });
const H: Opts = { priority: 'high' };

// ───────────────────────── Statele lumii ─────────────────────────

const STATE_ASPECTS: SeedItem[] = [
  m('Poziția economico-geografică (avantaje și dezavantaje)', { priority: 'high', est: 25 }),
  m('Capitala și orașele principale', { est: 15 }),
  m('Vecinii și ieșirea la mare / ocean', { est: 15 }),
  t('Relieful', { est: 20 }),
  t('Clima', { est: 20 }),
  t('Resursele naturale', { est: 20 }),
  t('Populația', { est: 20 }),
  t('Economia: nivel de dezvoltare și structură', { est: 20 }),
  t('Agricultura', { est: 20 }),
  t('Industria', { est: 20 }),
  t('Transporturile', { est: 15 }),
  t('Comerțul exterior', { est: 15 }),
  t('Particularitățile economico-geografice (sinteză)', { priority: 'high', est: 25 }),
];

const state = (code: string, name: string, month: MonthKey): ChapterSeed => ({
  code,
  title: name,
  month,
  items: STATE_ASPECTS.map((a) => ({ ...a })),
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
          t('Analizează programa oficială BAC Geografie (ANCE)', { est: 45 }),
          t('Structura testului: 3 domenii, 100 de puncte, 180 de minute', { est: 30 }),
          t('Pregătește cele 3 atlase școlare (clasele X, XI, XII)', { est: 15 }), // [programă] materiale permise
          p('Analizează subiectele BAC 2025 și baremul de corectare', { est: 60 }),
          p('Evaluare inițială: rezolvă un test complet și notează rezultatul', {
            est: 180,
            tag: 'simulation',
            date: '2026-11-21',
          }),
        ],
      },
    ],
  },
  {
    id: 'm1',
    code: '1',
    title: 'Bazele geografiei și Pământul',
    short: 'Pământul',
    chapters: [
      {
        code: '1.1',
        title: 'Planeta Pământ',
        month: '2026-11',
        items: [
          t('Pământul în Sistemul Solar'),
          t('Forma și dimensiunile Pământului'),
          t('Mișcarea de rotație'),
          t('Mișcarea de revoluție'),
          t('Consecințele mișcărilor Pământului (zi/noapte, anotimpuri)', H),
          t('Solstițiile și echinocțiile', H), // [programă] item frecvent
          t('Gravitația terestră (noțiune)'),
          t('Căldura internă a Pământului și importanța ei'), // [programă]
          t('Rolul și importanța caracteristicilor Pământului'), // [programă]
        ],
      },
      {
        code: '1.2',
        title: 'Reprezentarea cartografică',
        month: '2026-11',
        items: [
          t('Globul geografic'),
          t('Harta geografică — elemente'),
          t('Planul geografic'),
          t('Tipurile de hărți (generale, tematice)'),
          c('Scara numerică și scara grafică', H),
          m('Orientarea pe hartă'),
          m('Paralele și meridiane — rețeaua de grade'),
          m('Latitudinea și longitudinea'),
          c('Coordonate geografice — determinare pe atlas', H),
          c('Lungimea arcului de 1° (meridian ≈ 111 km, paralele variabile)', H), // [programă]
        ],
      },
      {
        code: '1.3',
        title: 'Ora pe Glob',
        month: '2026-11',
        items: [
          t('Ora locală'),
          t('Ora oficială (ora fusului) și ora de vară'),
          m('Fusurile orare — harta fuselor orare'),
          t('Linia internațională de schimbare a datei'),
          c('Calculul orei după rețeaua de grade (15° = 1 oră)', H),
          c('Calculul orei și datei după harta fuselor orare', H),
        ],
      },
    ],
  },
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
          t('Structura internă a Pământului'),
          t('Scoarța terestră și litosfera (noțiuni)'),
          t('Procesele endogene'),
          t('Mișcările tectonice și plăcile litosferice'),
          t('Vulcanismul', H),
          t('Cutremurele de pământ', H),
          t('Procesele exogene'),
          t('Eroziunea (noțiune)'),
          t('Alunecările de teren (noțiune)'),
          t('Clasificarea formelor de relief'),
          t('Munți, dealuri, podișuri și câmpii'),
          m('Unitățile majore de relief ale uscatului — localizare'),
          t('Relieful bazinelor oceanice'),
          t('Relieful gravitațional și torențial'),
          t('Relieful fluvial'),
          t('Relieful carstic'),
          t('Relieful eolian'),
          t('Relieful antropic'),
          t('Fenomene de risc: cutremure, erupții vulcanice, alunecări de teren', H),
          t('Rolul scoarței terestre în natură și pentru societate'), // [programă]
        ],
      },
      {
        code: '2.2',
        title: 'Atmosfera',
        month: '2026-12',
        items: [
          t('Compoziția atmosferei'),
          t('Structura atmosferei (straturile)'),
          t('Temperatura aerului'),
          t('Variația temperaturii aerului pe verticală'),
          c('Gradientul termic vertical — exerciții', H),
          m('Repartiția geografică a temperaturii aerului'),
          c('Amplitudinea termică — calcul', H),
          t('Presiunea atmosferică și repartiția ei geografică'),
          t('Vânturile: tipuri și importanță'),
          t('Alizeele'),
          t('Musonii'),
          t('Vânturile de vest și vânturile polare'), // [programă] „vânturile: tipuri”
          t('Ciclonii și anticiclonii'),
          t('Precipitațiile atmosferice'),
          m('Repartiția geografică a precipitațiilor'),
          t('Vremea și prevederea ei'), // [programă]
          t('Clima și factorii de formare a climei'),
          m('Zonele climatice', H),
          t('Tipurile de climă', H),
          m('Hărțile climatice'), // [programă]
          c('Climograme — citire și interpretare', H),
          t('Fenomene de risc: ploile acide și smogul'), // [programă]
          t('Fenomene de risc: grindina, seceta, uraganele'), // [programă]
          t('Rolul atmosferei în natură și pentru societate'), // [programă]
        ],
      },
      {
        code: '2.3',
        title: 'Hidrosfera',
        month: '2026-12',
        items: [
          t('Circulația apei pe Glob (circuitul apei)'),
          t('Componentele hidrosferei și repartiția apei'),
          m('Oceanul Planetar: oceane, mări, golfuri, strâmtori'),
          t('Proprietățile chimice ale apelor oceanice (salinitatea)'),
          t('Proprietățile fizice ale apelor oceanice (temperatura)'),
          t('Râurile și elementele lor'),
          t('Izvoare și afluenți'),
          t('Bazinele hidrografice'),
          t('Alimentarea râurilor'),
          t('Regimul de scurgere'),
          t('Importanța râurilor'),
          t('Lacurile: clasificare și caracteristici generale'),
          t('Lacuri tectonice'),
          t('Lacuri glaciare'),
          t('Lacuri vulcanice'),
          t('Lacuri carstice'),
          t('Importanța lacurilor'),
          t('Deltele și estuarele'),
          t('Limanele'),
          t('Fenomene de risc: tsunami și inundații', H),
          t('Rolul hidrosferei în natură și pentru societate'), // [programă]
          m('Marile râuri și lacuri ale lumii — localizare', H),
        ],
      },
      {
        code: '2.4',
        title: 'Biosfera și solul',
        month: '2026-12',
        items: [
          t('Biosfera (noțiune, limite)'),
          t('Solul (noțiune, componente)'),
          t('Factorii de pedogeneză', H),
          t('Principalele tipuri de sol pe Terra', H),
          m('Zonele de vegetație'),
          t('Distribuția vegetației și faunei'),
          t('Fenomene de risc: dispariția unor specii, pandemiile'), // [programă]
          t('Protecția biodiversității'),
          t('Degradarea solurilor'),
          t('Rolul biosferei și al solului în natură și pentru societate'), // [programă]
        ],
      },
      {
        code: '2.5',
        title: 'Mediile geografice',
        month: '2026-12',
        items: [
          t('Mediul geografic (noțiune)'),
          t('Mediile ecuatoriale'),
          t('Mediile subecuatoriale'),
          t('Mediile tropicale'),
          t('Mediile subtropicale'),
          t('Mediile temperate (păduri, stepă, deșert temperat)', H),
          t('Mediile subpolare'),
          t('Mediile polare'),
          t('Caracteristicile comparate: climă, sol, vegetație, faună', H),
          m('Localizarea mediilor geografice pe hartă', H),
        ],
      },
      {
        code: '2.6',
        title: 'Nomenclatura geografiei fizice (cl. a X-a)',
        month: '2026-12',
        priority: 'high',
        note: 'Programa: obiectivele geografice din curriculumul clasei a X-a sunt obligatorii.',
        items: [
          m('Europa: relief, râuri, lacuri, mări, peninsule'),
          m('Asia: relief, râuri, lacuri, mări, peninsule'),
          m('Africa: relief, râuri, lacuri'),
          m('America de Nord și America de Sud'),
          m('Australia, Oceania și Antarctida'),
          m('Oceanul Planetar: curenți, insule, strâmtori'),
        ],
      },
    ],
  },
  {
    id: 'm3',
    code: '3',
    title: 'Geografia umană și economică',
    short: 'Geografie umană',
    chapters: [
      {
        code: '3.1',
        title: 'Harta politică a lumii',
        month: '2027-01',
        items: [
          t('Evoluția hărții politice'),
          t('Schimbările cantitative și calitative contemporane', H), // [programă]
          t('State și teritorii'),
          t('Tipologia statelor (suprafață, populație, nivel de dezvoltare)'),
          t('Forma de guvernământ: monarhii și republici'),
          t('Organizarea administrativă: state unitare și federale'),
          t('Poziția economico-geografică (noțiune și apreciere)', H),
          m('Localizarea statelor și capitalelor lumii', H),
        ],
      },
      {
        code: '3.2',
        title: 'Condițiile și resursele naturale',
        month: '2027-01',
        items: [
          t('Condițiile naturale'),
          t('Resursele naturale (noțiune)'),
          t('Clasificarea resurselor naturale', H),
          t('Resurse regenerabile și neregenerabile'),
          t('Resursele extraatmosferice și ale atmosferei (agroclimatice)'), // [programă]
          t('Resursele hidrosferei'),
          t('Resursele litosferei (minerale)'),
          t('Resursele biosferei'),
          t('Resursele de sol. Fondul funciar'), // [programă]
          m('Localizarea marilor zăcăminte'),
        ],
      },
      {
        code: '3.3',
        title: 'Populația',
        month: '2027-01',
        items: [
          t('Numărul populației'),
          t('Dinamica numerică a populației'),
          t('Natalitatea (rata natalității)', H),
          t('Mortalitatea (rata mortalității)', H),
          t('Bilanțul natural', H),
          t('Tranziția demografică'),
          t('Tipurile de reproducere a populației'), // [programă] item frecvent
          t('Politicile demografice'),
          t('Mobilitatea teritorială: factori, tipizare, importanță'), // [programă]
          t('Migrația populației: tipuri'),
          t('Bilanțul migratoriu'),
          t('Exodul de intelecte'),
          t('Migrația ilegală'), // [programă]
          m('Repartiția geografică a populației'),
          t('Densitatea populației'),
          t('Structura pe grupe de vârstă (piramida vârstelor)', H),
          t('Structura pe sexe (genuri)'),
          t('Speranța de viață la naștere'),
          t('Structura socio-economică. Resursele umane'),
          t('Îmbătrânirea demografică'), // [programă]
        ],
      },
      {
        code: '3.4',
        title: 'Așezările umane',
        month: '2027-01',
        items: [
          t('Așezările rurale'),
          t('Așezările urbane'),
          t('Urbanizarea'),
          t('Aglomerațiile urbane'),
          t('Megalopolisurile'),
          t('Urbanizarea falsă'),
          t('Problemele actuale ale orașelor'),
          m('Localizarea marilor orașe și megalopolisuri'),
        ],
      },
      {
        code: '3.5',
        title: 'Economia mondială',
        month: '2027-01',
        items: [
          t('Economia mondială (noțiune)'),
          t('Produsul Intern Brut (PIB)'),
          t('Etapele dezvoltării: preindustrială, industrială, postindustrială'), // [programă]
          t('Revoluția științifico-tehnică'), // [programă]
          t('Structura economiei mondiale'),
          t('Sectoarele economiei: primar, secundar, terțiar'),
          t('Diviziunea geografică internațională a muncii'),
          t('Ramura de specializare internațională'),
          t('Integrarea economică (noțiune)'),
        ],
      },
      {
        code: '3.6',
        title: 'Agricultura',
        month: '2027-01',
        items: [
          t('Factorii dezvoltării agriculturii'),
          t('Structura agriculturii pe ramuri'),
          t('Agricultura tradițională și modernă', H),
          t('Cultura plantelor: clasificare și importanță'),
          t('Culturile cerealiere'),
          t('Plantele tehnice'),
          t('Legumicultura'),
          t('Pomicultura'),
          t('Viticultura'),
          t('Culturile furajere'), // [programă] item din testul model
          t('Creșterea animalelor (zootehnia): subramuri'),
          t('Importanța creșterii animalelor'),
          m('Repartiția geografică a agriculturii'),
        ],
      },
      {
        code: '3.7',
        title: 'Industria',
        month: '2027-01',
        items: [
          t('Factorii de amplasare a industriei', H),
          t('Structura industriei pe ramuri'),
          t('Materii prime și produse finite', H),
          t('Industria energetică: industria combustibililor'),
          t('Industria energetică: energia electrică (TE, HE, AE, surse regenerabile)'),
          t('Industria metalurgică (feroasă și neferoasă)'),
          t('Industria constructoare de mașini'),
          t('Industria de prelucrare a metalelor'),
          t('Industria ușoară'),
          t('Industria alimentară'),
          m('Repartiția geografică a industriei'),
        ],
      },
      {
        code: '3.8',
        title: 'Serviciile',
        month: '2027-02',
        items: [
          t('Rolul sectorului terțiar în economie'),
          t('Structura serviciilor pe ramuri'),
          t('Comerțul'),
          t('Transporturile: tipuri și importanță'),
          t('Comunicațiile'),
          t('Turismul'),
          t('Tipurile de turism (clasificare)'),
          t('Factorii dezvoltării turismului'),
          m('Marile zone turistice ale Globului', H),
        ],
      },
      {
        code: '3.9',
        title: 'Relațiile economice internaționale',
        month: '2027-02',
        items: [
          t('Formele principale ale relațiilor economice internaționale'),
          t('Comerțul internațional'),
          t('Exportul și importul. Balanța comercială'),
          t('Uniunea Europeană', H),
          t('OPEC'),
          t('Integrarea economică: avantaje și dezavantaje'),
        ],
      },
      {
        code: '3.10',
        title: 'Nomenclatura geografiei umane (cl. a XI-a)',
        month: '2027-02',
        priority: 'high',
        note: 'Programa: obiectivele geografice din curriculumul clasei a XI-a sunt obligatorii.',
        items: [
          m('Regiunile industriale și agricole importante'),
          m('Marile porturi și noduri de transport'),
          m('Obiective și destinații turistice'),
        ],
      },
    ],
  },
  {
    id: 'm4',
    code: '4',
    title: 'Statele lumii',
    short: 'Statele lumii',
    chapters: [
      state('4.1', 'Marea Britanie', '2027-02'),
      state('4.2', 'Franța', '2027-02'),
      state('4.3', 'Germania', '2027-02'),
      state('4.4', 'România', '2027-02'),
      state('4.5', 'Ucraina', '2027-02'),
      state('4.6', 'Rusia', '2027-02'),
      {
        code: '4.7',
        title: 'Localizarea statelor și capitalelor europene',
        month: '2027-02',
        priority: 'high',
        items: [
          m('Europa de Nord'),
          m('Europa de Vest'),
          m('Europa Centrală'),
          m('Europa de Sud'),
          m('Europa de Est'),
          p('Test personal pe harta-contur a Europei', { est: 30 }),
        ],
      },
      state('4.8', 'China', '2027-03'),
      state('4.9', 'Japonia', '2027-03'),
      state('4.10', 'India', '2027-03'),
      state('4.11', 'Statele Unite ale Americii', '2027-03'),
      state('4.12', 'Brazilia', '2027-03'),
      state('4.13', 'Republica Africa de Sud', '2027-03'),
      state('4.14', 'Uniunea Australiană', '2027-03'),
    ],
  },
  {
    id: 'm5',
    code: '5',
    title: 'Geografia Republicii Moldova',
    short: 'R. Moldova',
    chapters: [
      {
        code: '5.1',
        title: 'Mediul geografic',
        month: '2027-03',
        priority: 'high',
        items: [
          t('Poziția geografică'),
          t('Particularitățile mediului R. Moldova în context european și mondial'),
          t('Mediul natural, mediul antropizat, mediul antropic'),
          t('Componentele abiotice'),
          t('Componentele biotice'),
          t('Componentele antropice'),
        ],
      },
      {
        code: '5.2',
        title: 'Relieful și geologia',
        month: '2027-03',
        support: true,
        priority: 'low',
        note: 'Suport pentru argumentare — nu e unitate distinctă în programa BAC.',
        items: [
          t('Structura geologică'),
          m('Unitățile majore de relief'),
          t('Formele de relief'),
          t('Resursele minerale'),
        ],
      },
      {
        code: '5.3',
        title: 'Clima',
        month: '2027-03',
        support: true,
        priority: 'low',
        note: 'Suport pentru argumentare — nu e unitate distinctă în programa BAC.',
        items: [
          t('Caracteristicile climei'),
          t('Factorii climatici'),
          t('Temperatura'),
          t('Precipitațiile'),
          t('Vânturile'),
          t('Fenomenele climatice de risc'),
        ],
      },
      {
        code: '5.4',
        title: 'Apele',
        month: '2027-03',
        support: true,
        priority: 'low',
        note: 'Suport pentru argumentare — nu e unitate distinctă în programa BAC.',
        items: [
          m('Rețeaua hidrografică'),
          t('Râul Nistru'),
          t('Râul Prut'),
          t('Râurile mici'),
          t('Lacuri și acumulări de apă'),
          t('Resursele de apă'),
        ],
      },
      {
        code: '5.5',
        title: 'Solurile, vegetația și fauna',
        month: '2027-03',
        support: true,
        priority: 'low',
        note: 'Suport pentru argumentare — nu e unitate distinctă în programa BAC.',
        items: [
          t('Tipurile de sol'),
          t('Fertilitatea solurilor'),
          t('Vegetația naturală'),
          t('Fauna'),
          t('Protecția biodiversității'),
        ],
      },
      {
        code: '5.6',
        title: 'Populația Republicii Moldova',
        month: '2027-03',
        note: 'Programa: problema demografică și a migrației în R. Moldova.',
        items: [
          t('Numărul și dinamica populației'),
          t('Natalitatea și mortalitatea'),
          t('Bilanțul natural'),
          t('Migrația'),
          t('Densitatea populației'),
          t('Structura populației'),
          t('Urbanizarea'),
          t('Problemele demografice', H),
        ],
      },
      {
        code: '5.7',
        title: 'Economia Republicii Moldova',
        month: '2027-03',
        support: true,
        priority: 'low',
        note: 'Suport pentru problemele globale în R. Moldova (resurse, alimentar).',
        items: [
          t('Agricultura: cultura plantelor'),
          t('Agricultura: creșterea animalelor'),
          t('Industria'),
          t('Energia'),
          t('Industria alimentară'),
          t('Transporturile'),
          t('Comerțul exterior'),
          t('Resursele economice'),
          t('Particularitățile economiei naționale'),
        ],
      },
      {
        code: '5.8',
        title: 'Problemele mediului în R. Moldova',
        month: '2027-03',
        items: [
          t('Poluarea aerului'),
          t('Poluarea apelor'),
          t('Degradarea solurilor'),
          t('Alunecările de teren în R. Moldova', H), // [programă] item din testul model
          t('Despădurirea'),
          t('Protecția naturii'),
          m('Ariile protejate din R. Moldova', H),
          t('Problemele ecologice locale'),
        ],
      },
    ],
  },
  {
    id: 'm6',
    code: '6',
    title: 'Mediul și problemele globale',
    short: 'Probleme globale',
    chapters: [
      {
        code: '6.1',
        title: 'Calitatea și protecția mediului',
        month: '2027-04',
        items: [
          t('Degradarea mediului', H),
          t('Efectul de seră'),
          t('Monitoringul mediului'),
          t('Patrimoniul natural'),
          t('Patrimoniul cultural'),
          t('Calitatea, valorificarea și protecția aerului'),
          t('Calitatea, valorificarea și protecția apelor'),
          t('Calitatea, valorificarea și protecția vegetației'),
          t('Calitatea, valorificarea și protecția lumii animale'),
          t('Calitatea, valorificarea și protecția solului și subsolului'),
          t('Conservarea naturii și a patrimoniului cultural'),
          m('Ariile protejate în lume (UNESCO, parcuri naționale)'),
        ],
      },
      {
        code: '6.2',
        title: 'Problemele globale',
        month: '2027-04',
        items: [
          t('Schimbările climatice', H),
          t('Despădurirea'),
          t('Deșertificarea'),
          t('Poluarea mediului: global și local'),
          t('Criza energetică'),
          t('Asigurarea cu resurse naturale (lume și R. Moldova)'),
          t('Asigurarea cu apă potabilă (lume și R. Moldova)'),
          t('Problema demografică (lume și R. Moldova)'),
          t('Problema migrației (lume și R. Moldova)'),
          t('Problema alimentară (lume și R. Moldova)'),
          t('Hazardurile naturale (lume și R. Moldova)'),
          t('Hazardurile antropice'),
        ],
      },
      {
        code: '6.3',
        title: 'Dezvoltarea sustenabilă',
        month: '2027-04',
        items: [
          t('Conceptul de dezvoltare sustenabilă'),
          t('Caracteristicile dezvoltării sustenabile'),
          t('Valorificarea rațională a resurselor'),
          t('Protecția patrimoniului natural'),
          t('Protecția patrimoniului cultural'),
          t('Măsuri de dezvoltare sustenabilă (lume și R. Moldova)'),
          m('Nomenclatura clasei a XII-a — obiective obligatorii', H), // [programă]
        ],
      },
    ],
  },
  {
    id: 'm7',
    code: '7',
    title: 'Calcule și competențe practice',
    short: 'Competențe',
    chapters: [
      {
        code: '7.1',
        title: 'Calcule cartografice și ora',
        month: '2026-11',
        priority: 'high',
        items: [
          c('Determinarea coordonatelor geografice'),
          c('Calcularea distanțelor pe hartă (în grade și km)'),
          c('Utilizarea scării hărții'),
          c('Calcularea orei locale'),
          c('Calcularea diferențelor de timp și a datei'),
        ],
      },
      {
        code: '7.2',
        title: 'Calcule climatice și interpretări fizice',
        month: '2026-12',
        priority: 'high',
        items: [
          c('Amplitudinea termică'),
          c('Gradientul termic'),
          c('Interpretarea climogramelor'),
          c('Compararea a două râuri'),
          c('Interpretarea hărților tematice'),
        ],
      },
      {
        code: '7.3',
        title: 'Indicatori demografici și economici',
        month: '2027-01',
        priority: 'high',
        items: [
          c('Calcularea densității populației'),
          c('Rata natalității'),
          c('Rata mortalității'),
          c('Bilanțul natural'),
          c('Indicatori economici și demografici'),
          c('Interpretarea piramidei vârstelor'),
          c('Interpretarea graficelor'),
          c('Interpretarea diagramelor'),
        ],
      },
      {
        code: '7.4',
        title: 'Analiză și argumentare',
        month: '2027-02',
        items: [
          c('Analiza tabelelor statistice'),
          c('Compararea a două regiuni geografice'),
          c('Identificarea cauzelor și consecințelor geografice', { month: '2027-03' }),
          c('Formularea concluziilor geografice', { month: '2027-03' }),
          c('Argumentarea soluțiilor pentru probleme geografice', { month: '2027-04' }),
        ],
      },
    ],
  },
  {
    id: 'mp',
    code: 'P',
    title: 'Antrenament BAC și recapitulare',
    short: 'Antrenament',
    countsForProgress: false,
    chapters: [
      {
        code: 'P.1',
        title: 'Exerciții din subiecte anterioare',
        month: '2026-12',
        items: [
          p('Exerciții din subiecte anterioare: itemi de geografie fizică'),
          p('Exerciții din subiecte anterioare: calcule și climograme'),
          p('Exerciții practice: localizare pe hartă', { month: '2027-02' }),
          p('Exerciții practice: itemi de geografie umană', { month: '2027-02' }),
          r('Recapitularea formulelor și calculelor', { month: '2027-04' }),
          p('Itemi tip „Cunoaștere și înțelegere”', { month: '2027-04' }),
          p('Itemi tip „Aplicare și operare”', { month: '2027-04' }),
          p('Itemi tip „Integrare și transfer”', { month: '2027-04' }),
        ],
      },
      {
        code: 'P.2',
        title: 'Simulări complete (180 de minute)',
        month: '2027-04',
        priority: 'high',
        items: [
          p('Subiectul BAC 2025 — rezolvare completă', { tag: 'simulation', est: 180, date: '2027-04-17' }),
          p('Subiectul BAC 2026 — rezolvare completă', { tag: 'simulation', est: 180, date: '2027-04-24' }),
          p('Simulare completă #1', { tag: 'simulation', est: 180, date: '2027-05-01' }),
          p('Simulare completă #2', { tag: 'simulation', est: 180, date: '2027-05-08' }),
          p('Simulare completă #3', { tag: 'simulation', est: 180, date: '2027-05-15' }),
          p('Simulare completă #4', { tag: 'simulation', est: 180, date: '2027-05-22' }),
          p('Simulare completă #5', { tag: 'simulation', est: 180, date: '2027-05-29' }),
          p('Simulare finală #6', { tag: 'simulation', est: 180, date: '2027-06-05' }),
          p('Simulare finală #7', { tag: 'simulation', est: 180, date: '2027-06-12' }),
        ],
      },
      {
        code: 'P.3',
        title: 'Mai: greșeli și capitole slabe',
        month: '2027-05',
        items: [
          r('Analiza greșelilor din simularea #1'),
          r('Repetarea capitolelor slabe (săptămâna 1)'),
          p('Exerciții de localizare pe hartă (1)'),
          r('Analiza greșelilor din simularea #2'),
          r('Repetarea capitolelor slabe (săptămâna 2)'),
          p('Exerciții de localizare pe hartă (2)'),
          r('Analiza greșelilor din simularea #3'),
          r('Repetarea capitolelor slabe (săptămâna 3)'),
          p('Exerciții de localizare pe hartă (3)'),
          r('Analiza greșelilor din simularea #4'),
          r('Repetarea capitolelor slabe (săptămâna 4)'),
          p('Exerciții de localizare pe hartă (4)'),
          r('Analiza greșelilor din simularea #5'),
        ],
      },
      {
        code: 'P.4',
        title: 'Iunie: recapitulare generală',
        month: '2027-06',
        priority: 'high',
        items: [
          r('Recapitulare: Pământul și geografia fizică'),
          r('Recapitulare: geografia umană și economică'),
          r('Recapitulare: statele lumii'),
          r('Recapitulare: R. Moldova și problemele globale'),
          r('Recapitulare: formule și calcule'),
          r('Recapitulare: localizări geografice'),
          r('Recapitulare: definiții și concepte din programă'),
          r('Pregătire pentru examen: atlase, pix, odihnă', { date: '2027-06-17', est: 30 }),
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
