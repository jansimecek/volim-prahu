import { rozhovory as vse } from '#content'
import { celeJmeno, kandidaturyOsoby } from './kandidatky'

/**
 * Rozhovory s kandidáty v médiích.
 *
 * Web nepřebírá cizí text — ukládá odkaz, kdo s kým a kdy mluvil, a vlastní
 * anotaci. Jméno se dopočítává z kandidátních listin ČSÚ, ne z obsahu:
 * kdyby ho psal redaktor, mohlo by se rozejít s tím, co je na listině.
 */

export type Rozhovor = (typeof vse)[number]

export type RozhovorSOsobou = Rozhovor & {
  jmeno: string
  /** Volební strana z kandidátky. Null, když osobu v datech nenajdeme. */
  strana: string | null
}

function odNejnovejsiho(a: Rozhovor, b: Rozhovor): number {
  return b.datum.localeCompare(a.datum) || a.slug.localeCompare(b.slug, 'cs')
}

/** Doplní jméno a stranu z dat ČSÚ. */
function sOsobou(r: Rozhovor): RozhovorSOsobou {
  const kandidatury = kandidaturyOsoby(r.osoba)
  const prvni = kandidatury[0]
  return {
    ...r,
    // Fallback na slug je poslední záchrana; validace to nemá pustit.
    jmeno: prvni ? celeJmeno(prvni.kandidat) : r.osoba,
    strana: prvni?.strana.nazev ?? null,
  }
}

export function vsechnyRozhovory(): RozhovorSOsobou[] {
  return [...vse].sort(odNejnovejsiho).map(sOsobou)
}

/** Rozhovory s jednou osobou. Vykresluje se na jejím profilu. */
export function rozhovoryOsoby(osobaSlug: string): RozhovorSOsobou[] {
  return vse.filter((r) => r.osoba === osobaSlug).sort(odNejnovejsiho).map(sOsobou)
}

/** Kolik osob má aspoň jeden rozhovor. Bez toho by výpis tvrdil úplnost. */
export function pocetOsobSRozhovorem(): number {
  return new Set(vse.map((r) => r.osoba)).size
}
