import { zpravicky as vse } from '#content'
import { smiZobrazitPruzkumZaBehu } from './zaBehu'

/**
 * Zprávičky — krátké zápisy o průběhu voleb.
 *
 * Rubrika existuje proto, že spousta věcí kolem voleb je zajímavá, ale
 * nevydá na stránku: losování čísel, termín vyvěšení oznámení, zveřejněný
 * program. Zprávička je má kam zapsat, aniž by se z nich staly články.
 *
 * Platí tu stejné pravidlo jako všude jinde: tvrzení o volbách má zdroj.
 * Vynucuje to schéma ve velite.config.ts, ne dobrá vůle.
 */

export type Zpravicka = (typeof vse)[number]

const jeVyvoj = process.env.NODE_ENV !== 'production'

/** Nejnovější napřed. Řadí se řetězcově — ISO 8601 s posunem je porovnatelný. */
function odNejnovejsi(a: Zpravicka, b: Zpravicka): number {
  return Date.parse(b.vydano) - Date.parse(a.vydano) || a.slug.localeCompare(b.slug, 'cs')
}

/**
 * Koncepty se v produkci nezobrazují nikde — ani ve výpisu, ani na vlastní
 * adrese, ani ve feedu. Ve vývoji ano, aby šly psát a číst.
 *
 * Zprávičky s budoucím časem vydání se nezobrazí, dokud ten čas nenastane.
 * Bez toho by šlo zprávičku připravit dopředu, ale nasazení by ji hned
 * vydalo — a datum nad ní by tvrdilo něco jiného, než co platí.
 */
export function publikovane(ted: Date = new Date()): Zpravicka[] {
  return vse
    .filter((z) => (jeVyvoj || !z.koncept) && Date.parse(z.vydano) <= ted.getTime())
    .sort(odNejnovejsi)
}

/** Nese zprávička čísla z předvolebního průzkumu? */
export function jeSPruzkumem(z: Zpravicka): boolean {
  return z.obsahujePruzkum
}

/**
 * Zprávičky určené k zobrazení.
 *
 * Rubrika je druhé místo, kudy by se výsledky průzkumu mohly dostat ven —
 * schéma u ní jinak vyžaduje jen zdroj. Zprávičky označené příznakem
 * `obsahujePruzkum` proto procházejí stejnou branou jako kolekce průzkumů,
 * a stejně jako tam se moratorium vyhodnocuje až při vyřizování požadavku.
 *
 * Dokud žádná taková zprávička neexistuje, brána se nezapíná a stránky
 * zůstávají statické.
 */
export async function kZobrazeni(): Promise<Zpravicka[]> {
  const seznam = publikovane()
  const smi = await smiZobrazitPruzkumZaBehu(seznam.some(jeSPruzkumem))
  return smi ? seznam : seznam.filter((z) => !jeSPruzkumem(z))
}

export async function zpravickaPodleSlugu(slug: string): Promise<Zpravicka | undefined> {
  return (await kZobrazeni()).find((z) => z.slug === slug)
}

/** Poslední zprávičky pro titulní stranu. */
export async function nejnovejsi(pocet: number): Promise<Zpravicka[]> {
  return (await kZobrazeni()).slice(0, pocet)
}

/**
 * Čas se formátuje výslovně v pražské zóně. Server na Vercelu běží v UTC
 * a bez `timeZone` by tam každá zprávička vyšla o dvě hodiny dřív —
 * na téhle chybě už se projekt jednou chytil u dat ČSÚ.
 */
const formatCasu = new Intl.DateTimeFormat('cs-CZ', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Prague',
})

const formatDne = new Intl.DateTimeFormat('cs-CZ', {
  dateStyle: 'long',
  timeZone: 'Europe/Prague',
})

/** Ve výpisu nese datum nadpis skupiny, u položky stačí hodina. */
const formatHodiny = new Intl.DateTimeFormat('cs-CZ', {
  timeStyle: 'short',
  timeZone: 'Europe/Prague',
})

export function casCesky(vydano: string): string {
  return formatCasu.format(new Date(vydano))
}

export function denCesky(vydano: string): string {
  return formatDne.format(new Date(vydano))
}

export function hodinaCesky(vydano: string): string {
  return formatHodiny.format(new Date(vydano))
}

/** Skupiny po dnech pro výpis — proud zpráviček se čte po dnech, ne po kusech. */
export function poDnech(seznam: Zpravicka[]): { den: string; zpravicky: Zpravicka[] }[] {
  const skupiny: { den: string; zpravicky: Zpravicka[] }[] = []
  for (const z of seznam) {
    const den = denCesky(z.vydano)
    const posledni = skupiny.at(-1)
    if (posledni?.den === den) posledni.zpravicky.push(z)
    else skupiny.push({ den, zpravicky: [z] })
  }
  return skupiny
}

export type ObrazekZpravicky = NonNullable<Zpravicka['obrazek']>

/** Sjednocuje obrázek z repozitáře a obrázek z Vercel Blobu na jeden tvar. */
export function rozmeryObrazku(
  obrazek: ObrazekZpravicky,
): { src: string; sirka: number; vyska: number } | null {
  if (obrazek.soubor) {
    return {
      src: obrazek.soubor.src,
      sirka: obrazek.soubor.width,
      vyska: obrazek.soubor.height,
    }
  }
  if (obrazek.url && obrazek.sirka && obrazek.vyska) {
    return { src: obrazek.url, sirka: obrazek.sirka, vyska: obrazek.vyska }
  }
  // Schéma tenhle stav nepustí; kdyby přesto nastal, radši nic než rozbité rozvržení.
  return null
}

/** Kolik zpráviček se vejde na jednu stránku výpisu. */
export const NA_STRANU = 30

export type Strankovani = {
  cislo: number
  celkem: number
  zpravicky: Zpravicka[]
}

/**
 * Stránkování je záměrně klasické, adresovatelné a funguje bez JavaScriptu.
 * Nekonečné rolování by znemožnilo dostat se do patičky a při návratu
 * z jedné zprávičky by čtenáře vrátilo na začátek.
 */
export async function stranka(cislo: number): Promise<Strankovani> {
  const vse = await kZobrazeni()
  const celkem = Math.max(1, Math.ceil(vse.length / NA_STRANU))
  const bezpecne = Math.min(Math.max(1, Math.trunc(cislo)), celkem)
  return {
    cislo: bezpecne,
    celkem,
    zpravicky: vse.slice((bezpecne - 1) * NA_STRANU, bezpecne * NA_STRANU),
  }
}
