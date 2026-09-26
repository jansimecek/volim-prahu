import { debaty as data } from '#content'
import { celeJmeno, kandidaturyOsoby } from './kandidatky'

/**
 * Kalendář debat kandidátů na primátora.
 *
 * Debaty se dělí na nadcházející a proběhlé podle pražského data. Server
 * na Vercelu běží v UTC, takže bez výslovné zóny by se večerní debata
 * mezi půlnocí a druhou ráno tvářila jako včerejší.
 */

export type Debata = (typeof data.debaty)[number]
export type DebataBezTerminu = (typeof data.bezTerminu)[number]

export type Ucastnik = { slug: string; jmeno: string }

const prazskeDatum = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague', dateStyle: 'short' })

/** Dnešní datum v Praze jako YYYY-MM-DD, aby šlo porovnat s `datum` z obsahu. */
export function dnesVPraze(ted: Date = new Date()): string {
  return prazskeDatum.format(ted)
}

/** Velite ukládá `isodate` jako půlnoc UTC; kalendářní den je prvních deset znaků. */
const den = (d: Debata): string => d.datum.slice(0, 10)

function chronologicky(a: Debata, b: Debata): number {
  return a.datum.localeCompare(b.datum) || (a.cas ?? '').localeCompare(b.cas ?? '')
}

/**
 * Nadcházející od nejbližší, proběhlé od nejnovější. Dnešní debata patří
 * celý den mezi nadcházející — i ta večerní, která ještě nezačala.
 */
export function rozdelDebaty(ted: Date = new Date()): { nadchazejici: Debata[]; probehle: Debata[] } {
  const dnes = dnesVPraze(ted)
  const vse = [...data.debaty].sort(chronologicky)
  return {
    nadchazejici: vse.filter((d) => den(d) >= dnes),
    probehle: vse.filter((d) => den(d) < dnes).reverse(),
  }
}

export function debatyBezTerminu(): DebataBezTerminu[] {
  return data.bezTerminu
}

export function overenoDebaty(): string {
  return data.overeno
}

/** Jména účastníků z dat ČSÚ, ve stejném pořadí jako v obsahu. */
export function ucastniciDebaty(d: Debata): Ucastnik[] {
  return d.ucastnici.map((slug) => {
    const prvni = kandidaturyOsoby(slug)[0]
    // Fallback na slug je poslední záchrana; validace to nemá pustit.
    return { slug, jmeno: prvni ? celeJmeno(prvni.kandidat) : slug }
  })
}

const denVTydnu = new Intl.DateTimeFormat('cs-CZ', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/**
 * „čtvrtek 1. října". Datum z obsahu je kalendářní den bez času; formátuje
 * se ve stejné zóně, v jaké se z řetězce vytvořil, aby se den nemohl posunout.
 */
export function denDebaty(d: Debata): string {
  return denVTydnu.format(new Date(d.datum))
}
