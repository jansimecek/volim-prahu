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
 * Čisté vyhledání adresy je v `okrskyHledani.ts`, aby ho mohl použít
 * i klientský vyhledávač bez `node:fs`.
 *
 * Adresa volební místnosti v datech ČÚZK není (až na poznámky, které si do
 * RÚIAN zapsala Praha 9). Ta se bere z oznámení městských částí, viz
 * `src/lib/mistnosti.ts`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AdresyMestskeCasti } from './okrskyHledani'

export {
  najdiAdresu,
  normalizujCislo,
  normalizujUlici,
  uliceMestskeCasti,
  type AdresyMestskeCasti,
  type NalezenaAdresa,
  type RadekAdresy,
} from './okrskyHledani'

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

/**
 * Index ulic pro vyhledávač: název ulice → městské části, ve kterých leží.
 * Ulice jako Sokolovská nebo Vinohradská procházejí několika částmi, proto
 * pole. Skládá se z 57 souborů, takže patří do build-time routy, ne na
 * stránku — asi 11 tisíc názvů.
 */
export function indexUlic(slugy: string[]): Record<string, string[]> {
  const index: Record<string, string[]> = {}
  for (const slug of slugy) {
    const adresy = adresyMestskeCasti(slug)
    if (!adresy) continue
    for (const ulice of Object.keys(adresy.ulice)) (index[ulice] ??= []).push(slug)
  }
  return Object.fromEntries(Object.keys(index).sort((a, b) => a.localeCompare(b, 'cs')).map((u) => [u, index[u]!]))
}
