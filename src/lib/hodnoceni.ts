/**
 * Hodnotící rámec proveditelnosti — jádro produktu (kap. 8 zadání).
 *
 * Zásady, které se nesmí porušit:
 *  - Není to verdikt pravda/lež. Slovník je o proveditelnosti, ne o pravdivosti.
 *  - Barvy nejsou semafor. Odvozují se z --inkoust / --okr / --praha / --seda-uredni,
 *    protože zeleno-červená škála implikuje verdikt.
 *  - Každý závěr musí mít zdůvodnění se zdrojem (vynuceno Zod schématem, ne revizí).
 */

export const KOMPETENCE = ['v-pravomoci', 'castecne', 'mimo-pravomoc'] as const
export const ROZPOCET = ['pokryto', 'nejiste', 'nepokryto'] as const
export const CAS = ['do-4-let', 'presahuje', 'nedatovano'] as const
export const HISTORIE = ['splneno', 'castecne-splneno', 'nesplneno', 'bez-historie'] as const
export const ZAVER = ['realny', 'podminecne-realny', 'nerealny-v-tomto-obdobi', 'mimo-pravomoc'] as const

export type Kompetence = (typeof KOMPETENCE)[number]
export type Rozpocet = (typeof ROZPOCET)[number]
export type Cas = (typeof CAS)[number]
export type Historie = (typeof HISTORIE)[number]
export type Zaver = (typeof ZAVER)[number]

/**
 * Tón určuje vizuální stav buňky razítka. Záměrně čtyři hodnoty, ne tři —
 * „nezname" (chybějící podklad) se nesmí vizuálně slít s „prekazka".
 */
export type Ton = 'prima' | 'stredni' | 'prekazka' | 'nezname'

export const TON_TRIDA: Record<Ton, string> = {
  prima: 'razitko-prima',
  stredni: 'razitko-stredni',
  prekazka: 'razitko-prekazka',
  nezname: 'razitko-nezname',
}

type StavPopis = { zkratka: string; popis: string; ton: Ton }

export const POPIS_KOMPETENCE: Record<Kompetence, StavPopis> = {
  'v-pravomoci': {
    zkratka: 'v pravomoci',
    popis: 'Úroveň samosprávy, do které se kandiduje, o této věci skutečně rozhoduje.',
    ton: 'prima',
  },
  castecne: {
    zkratka: 'částečně',
    popis: 'Rozhodnutí je sdílené s jinou úrovní — magistrátem, státem nebo městskou firmou.',
    ton: 'stredni',
  },
  'mimo-pravomoc': {
    zkratka: 'mimo pravomoc',
    popis: 'O věci rozhoduje někdo jiný. Zvolení zastupitelé ji přímo prosadit nemohou.',
    ton: 'prekazka',
  },
}

export const POPIS_ROZPOCET: Record<Rozpocet, StavPopis> = {
  pokryto: {
    zkratka: 'pokryto',
    popis: 'Náklady se vejdou do rozpočtového rámce, který má daná úroveň k dispozici.',
    ton: 'prima',
  },
  nejiste: {
    zkratka: 'nejisté',
    popis: 'Krytí závisí na externím zdroji — dotaci, prodeji majetku nebo úvěru.',
    ton: 'stredni',
  },
  nepokryto: {
    zkratka: 'nepokryto',
    popis: 'Odhadované náklady výrazně přesahují dostupné zdroje a slib neuvádí, odkud je vzít.',
    ton: 'prekazka',
  },
}

export const POPIS_CAS: Record<Cas, StavPopis> = {
  'do-4-let': {
    zkratka: 'do 4 let',
    popis: 'Slib je dokončitelný ve volebním období 2026–2030.',
    ton: 'prima',
  },
  presahuje: {
    zkratka: 'přesahuje',
    popis: 'Příprava a povolování trvají déle než jedno volební období.',
    ton: 'stredni',
  },
  nedatovano: {
    zkratka: 'nedatováno',
    popis: 'Slib neuvádí termín, takže ho nelze v čase ověřit.',
    ton: 'nezname',
  },
}

export const POPIS_HISTORIE: Record<Historie, StavPopis> = {
  splneno: {
    zkratka: 'splněno',
    popis: 'Stejný nebo obdobný slib subjekt v minulém období splnil.',
    ton: 'prima',
  },
  'castecne-splneno': {
    zkratka: 'částečně',
    popis: 'Obdobný slib se posunul, ale nedošel do konce.',
    ton: 'stredni',
  },
  nesplneno: {
    zkratka: 'nesplněno',
    popis: 'Stejný slib subjekt v minulém období dal a nesplnil.',
    ton: 'prekazka',
  },
  'bez-historie': {
    zkratka: 'bez historie',
    popis: 'Subjekt na této úrovni dosud nevládl, není s čím porovnat.',
    ton: 'nezname',
  },
}

export const POPIS_ZAVER: Record<Zaver, { nazev: string; popis: string; ton: Ton }> = {
  realny: {
    nazev: 'Proveditelné',
    popis: 'Je v pravomoci, má krytí a vejde se do volebního období.',
    ton: 'prima',
  },
  'podminecne-realny': {
    nazev: 'Proveditelné za podmínek',
    popis: 'Splnitelné, ale závisí na věci, kterou subjekt sám neovlivní.',
    ton: 'stredni',
  },
  'nerealny-v-tomto-obdobi': {
    nazev: 'Nedokončitelné v tomto období',
    popis: 'Zahájit lze, dokončit ve čtyřech letech ne.',
    ton: 'stredni',
  },
  'mimo-pravomoc': {
    nazev: 'Mimo pravomoc úrovně',
    popis: 'Rozhoduje o tom jiná úroveň samosprávy nebo stát.',
    ton: 'prekazka',
  },
}

/** Čtyři osy razítka v pevném pořadí — pořadí je součástí vizuální identity, neměnit. */
export const OSY = [
  { klic: 'kompetence', popisek: 'KOMPETENCE', popisy: POPIS_KOMPETENCE },
  { klic: 'rozpocet', popisek: 'ROZPOČET', popisy: POPIS_ROZPOCET },
  { klic: 'cas', popisek: 'ČAS', popisy: POPIS_CAS },
  { klic: 'historie', popisek: 'HISTORIE', popisy: POPIS_HISTORIE },
] as const

/** Minimální délka zdůvodnění. Vynuceno při buildu — viz velite.config.ts. */
export const MIN_DELKA_ZDUVODNENI = 120
