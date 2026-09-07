/**
 * Vyhledání okrsku podle adresy — čisté funkce nad daty jedné městské části.
 * Bez `node:fs`, aby je mohl použít klientský vyhledávač na /kde-volim
 * i testy bez souborů. Načítání souborů je v `okrsky.ts`.
 */
import { bezDiakritiky } from './slug'

/** Jeden řádek v `adresy/<mč>.json`: [číslo domu, okrsek, kód ADM, lat, lon]. */
export type RadekAdresy = [cislo: string, okrsek: number, adm: number, lat: number, lon: number]

export type AdresyMestskeCasti = {
  mestskaCast: string
  kodMomc: string
  stazeno: string
  sloupce: ['cislo', 'okrsek', 'adm', 'lat', 'lon']
  /** Klíč je název ulice (nebo části obce, kde ulice nejsou). */
  ulice: Record<string, RadekAdresy[]>
}

export type NalezenaAdresa = {
  ulice: string
  cislo: string
  okrsek: number
  adm: number
  poloha: { lat: number; lon: number }
}

/** „Partyzánská" i „partyzanska " i „PARTYZÁNSKÁ" jsou táž ulice. */
export function normalizujUlici(text: string): string {
  return bezDiakritiky(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Normalizace čísla domu z uživatelského vstupu. „18/23a" zůstane, „23 a"
 * se srazí na „23a", „č. ev. 6" na „č.ev. 6".
 */
export function normalizujCislo(text: string): string {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ')
  const ev = t.match(/^(?:č\.?\s*ev\.?|ev\.?)\s*(\d+)$/)
  if (ev) return `č.ev. ${ev[1]}`
  return t.replace(/\s*\/\s*/g, '/').replace(/(\d)\s+([a-z])$/, '$1$2')
}

/**
 * Najde okrsek podle ulice a čísla domu. Čistá funkce nad daty jedné městské
 * části, aby šla testovat bez souborů.
 *
 * Číslo domu se zkouší třemi způsoby: celé „popisné/orientační", samotné
 * orientační (to Pražan zná ze štítku na domě) a samotné popisné. Když je
 * shoda víc než jedna, vrátí se všechny — rozhodnout musí čtenář, ne kód.
 */
export function najdiAdresu(
  adresy: AdresyMestskeCasti,
  ulice: string,
  cislo: string,
): NalezenaAdresa[] {
  const hledanaUlice = normalizujUlici(ulice)
  const hledaneCislo = normalizujCislo(cislo)
  if (!hledanaUlice || !hledaneCislo) return []

  const vysledek: NalezenaAdresa[] = []
  for (const [nazev, radky] of Object.entries(adresy.ulice)) {
    if (normalizujUlici(nazev) !== hledanaUlice) continue
    for (const [c, okrsek, adm, lat, lon] of radky) {
      const [popisne, orientacni] = c.startsWith('č.ev.') ? [c, ''] : c.split('/')
      const shoda =
        c === hledaneCislo || (!hledaneCislo.includes('/') && (orientacni === hledaneCislo || popisne === hledaneCislo))
      if (shoda) vysledek.push({ ulice: nazev, cislo: c, okrsek, adm, poloha: { lat, lon } })
    }
  }
  return vysledek
}

/** Ulice městské části pro našeptávač, česky seřazené. */
export function uliceMestskeCasti(adresy: AdresyMestskeCasti): string[] {
  return Object.keys(adresy.ulice).sort((a, b) => a.localeCompare(b, 'cs'))
}
