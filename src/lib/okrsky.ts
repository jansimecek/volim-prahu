/**
 * Volební okrsky Prahy — čtení dat z `data/okrsky/` a vyhledání okrsku
 * podle adresy. Data generuje `pnpm import:okrsky` ze sestav ČÚZK.
 *
 * Tři soubory, každý na jinou otázku:
 *  - `prehled.json` — 1 120 okrsků: číslo, městská část, střed, počet adres.
 *  - `adresy/<mč>.json` — každé adresní místo městské části a jeho okrsek.
 *    Načítá se jen pro jednu městskou část, celá Praha má 135 tisíc adres.
 *  - `hranice/<mč>.geojson` — polygony okrsků ve WGS84 pro mapu.
 *
 * Adresa volební místnosti v datech ČÚZK není (až na poznámky, které si do
 * RÚIAN zapsala Praha 9). Ta se bere z oznámení městských částí, viz
 * `src/lib/mistnosti.ts`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bezDiakritiky } from './slug'

export type Okrsek = {
  cislo: number
  /** Kód okrsku v RÚIAN. */
  kod: number
  mestskaCast: string
  kodMomc: string
  /** Počet adresních míst, která RÚIAN do okrsku řadí. */
  adres: number
  /** Definiční bod okrsku, [lon, lat] jako v GeoJSON. */
  stred: [number, number]
  platiOd: string
  /** Poznámka správce v RÚIAN — u Prahy 9 obsahuje adresu volební místnosti. */
  poznamka?: string
}

export type PrehledOkrsku = {
  stazeno: string
  /** Datum stavu RÚIAN, ke kterému byly hranice vygenerovány. */
  stavHranic: string
  zdroje: { nazev: string; url: string }[]
  okrsky: Okrsek[]
}

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

export type HraniceOkrsku = {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    properties: { cislo: number; kod: number; mestskaCast: string }
    geometry:
      | { type: 'Polygon'; coordinates: [number, number][][] }
      | { type: 'MultiPolygon'; coordinates: [number, number][][][] }
  }[]
}

const KOREN_DAT = () => join(process.cwd(), 'data/okrsky')

let cachePrehledu: PrehledOkrsku | null | undefined
const cacheAdres = new Map<string, AdresyMestskeCasti | null>()
const cacheHranic = new Map<string, HraniceOkrsku | null>()

function nactiJson<T>(cesta: string): T | null {
  return existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as T) : null
}

export function prehledOkrsku(): PrehledOkrsku | null {
  if (cachePrehledu === undefined) {
    cachePrehledu = nactiJson<PrehledOkrsku>(join(KOREN_DAT(), 'prehled.json'))
  }
  return cachePrehledu
}

export function okrsekPodleCisla(cislo: number): Okrsek | undefined {
  return prehledOkrsku()?.okrsky.find((o) => o.cislo === cislo)
}

export function okrskyMestskeCasti(slug: string): Okrsek[] {
  return prehledOkrsku()?.okrsky.filter((o) => o.mestskaCast === slug) ?? []
}

export function adresyMestskeCasti(slug: string): AdresyMestskeCasti | null {
  if (!cacheAdres.has(slug)) {
    cacheAdres.set(slug, nactiJson<AdresyMestskeCasti>(join(KOREN_DAT(), 'adresy', `${slug}.json`)))
  }
  return cacheAdres.get(slug) ?? null
}

export function hraniceMestskeCasti(slug: string): HraniceOkrsku | null {
  if (!cacheHranic.has(slug)) {
    cacheHranic.set(slug, nactiJson<HraniceOkrsku>(join(KOREN_DAT(), 'hranice', `${slug}.geojson`)))
  }
  return cacheHranic.get(slug) ?? null
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
