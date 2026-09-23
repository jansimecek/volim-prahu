/**
 * Zóny placeného stání v okolí volební místnosti.
 *
 *   pnpm import:parkovani           # stáhne zóny a přepočítá
 *   pnpm import:parkovani --znovu   # ignoruje staženou kopii v tmp-import/
 *
 * Zdroj: otevřená data hl. m. Prahy, datová sada „Zóny placeného stání
 * vymezené tarifem" na Geoportálu Praha (poskytovatel HMP-TSK, licence CC BY).
 * Úseky nesou tarif slovy — dny, hodiny a cenu — a ten se přebírá doslova,
 * nepřepisuje se. Odvozovat z něj „dá se tam zaparkovat" by bylo tvrzení,
 * které web doložit nemůže: o volném místě data nic neříkají.
 *
 * Výstup `data/mistnosti/parkovani.json` čte `src/lib/parkovani.ts`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { polohaAdresyVPraze, type Poloha } from '../src/lib/geokodovani'
import { bodVGeometrii, type Geometrie, type Pozice } from '../src/lib/geometrie'
import { adresyMestskeCasti } from '../src/lib/okrsky'
import type { AdresyMestskeCasti } from '../src/lib/okrskyHledani'
import type { ParkovaniMistnosti, ZonaMistnosti } from '../src/lib/parkovaniTypy'

const KOREN = join(__dirname, '..')
const CIL = join(KOREN, 'data/mistnosti/parkovani.json')
const CACHE = join(KOREN, 'tmp-import/parkovani/zps.geojson')
const ITEM = '8e3420ecc539468489101958689a3cd9'
const URL_ZON = `https://opendata.geoportalpraha.cz/api/download/v1/items/${ITEM}/geojson?layers=0`
const URL_DATOVE_SADY = `https://opendata.geoportalpraha.cz/datasets/iprpraha::zóny-placeného-stání-vymezené-tarifem`
const ZNOVU = process.argv.includes('--znovu')

/**
 * Do kolika metrů od místnosti se zóna ještě počítá. Volič parkuje v ulici
 * u budovy, ne kdekoli ve čtvrti; 150 m je zhruba blok domů.
 */
const OKOLI_METRU = 150

type PrvekZony = {
  properties: { category?: string; tariftext?: string; code?: string }
  geometry: Geometrie | null
}

type MistnostYaml = {
  mestskaCast: string
  mistnosti: { nazev: string; adresa: string; okrsky: number[]; poloha?: Poloha }[]
}

async function stahni(): Promise<{ features: PrvekZony[] }> {
  if (!ZNOVU && existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, 'utf8'))
  const odpoved = await fetch(URL_ZON)
  if (!odpoved.ok) throw new Error(`Stažení ${URL_ZON} selhalo (${odpoved.status})`)
  const text = await odpoved.text()
  mkdirSync(join(CACHE, '..'), { recursive: true })
  writeFileSync(CACHE, text)
  return JSON.parse(text)
}

/** Stupně zeměpisné délky a šířky na metry v pražské šířce. */
const M_NA_STUPEN_LAT = 111_320
const M_NA_STUPEN_LON = 71_700

function vzdalenostKUsecce(bod: Pozice, a: Pozice, b: Pozice): number {
  const px = (bod[0] - a[0]) * M_NA_STUPEN_LON
  const py = (bod[1] - a[1]) * M_NA_STUPEN_LAT
  const ux = (b[0] - a[0]) * M_NA_STUPEN_LON
  const uy = (b[1] - a[1]) * M_NA_STUPEN_LAT
  const delka = ux * ux + uy * uy
  const t = delka === 0 ? 0 : Math.max(0, Math.min(1, (px * ux + py * uy) / delka))
  const dx = px - t * ux
  const dy = py - t * uy
  return Math.sqrt(dx * dx + dy * dy)
}

function vzdalenostKGeometrii(bod: Pozice, geometrie: Geometrie): number {
  if (bodVGeometrii(bod, geometrie)) return 0
  const polygony = geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates
  let nejmensi = Infinity
  for (const polygon of polygony) {
    for (const prstenec of polygon) {
      for (let i = 1; i < prstenec.length; i++) {
        const d = vzdalenostKUsecce(bod, prstenec[i - 1]!, prstenec[i]!)
        if (d < nejmensi) nejmensi = d
      }
    }
  }
  return nejmensi
}

/** Obalová obálka prvku v metrech kolem bodu — hrubý předvýběr, ať se nepočítá 5 590 polygonů na místnost. */
function obalka(geometrie: Geometrie): [number, number, number, number] {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  const polygony = geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates
  for (const polygon of polygony) {
    for (const prstenec of polygon) {
      for (const [lon, lat] of prstenec) {
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }
    }
  }
  return [minLon, minLat, maxLon, maxLat]
}

/** „Po-Ne 08:00-19:59 80Kč/hod<br/>Po-Ne 20:00-05:59 80Kč/hod" → dva řádky. */
function tarifRadky(text: string): string[] {
  return text
    .split(/<br\s*\/?>/i)
    .map((r) => r.replace(/\s+/g, ' ').trim())
    .filter((r) => r !== '')
}

async function main() {
  const data = await stahni()
  const zony = data.features
    .filter((f): f is PrvekZony & { geometry: Geometrie } => f.geometry !== null)
    .map((f) => ({ ...f, obalka: obalka(f.geometry) }))
  console.log(`Zóny placeného stání: ${zony.length} úseků.`)

  const soubory: MistnostYaml[] = JSON.parse(
    readFileSync(join(KOREN, '.velite/volebniMistnosti.json'), 'utf8'),
  )
  const registry = new Map<string, AdresyMestskeCasti>()
  for (const soubor of soubory) {
    const adresy = adresyMestskeCasti(soubor.mestskaCast)
    if (adresy) registry.set(soubor.mestskaCast, adresy)
  }

  const zaznamy: ParkovaniMistnosti['mistnosti'] = []
  const videne = new Set<string>()
  let bezPolohy = 0
  for (const soubor of soubory) {
    const adresy = registry.get(soubor.mestskaCast)
    const ostatni = [...registry.entries()]
      .filter(([slug]) => slug !== soubor.mestskaCast)
      .map(([, a]) => a)
    for (const m of soubor.mistnosti) {
      const klic = `${soubor.mestskaCast}|${m.adresa}`
      if (videne.has(klic)) continue
      videne.add(klic)
      const poloha =
        m.poloha ?? (adresy ? polohaAdresyVPraze(m.adresa, adresy, ostatni, m.okrsky) : undefined)
      if (!poloha) {
        bezPolohy++
        continue
      }

      const bod: Pozice = [poloha.lon, poloha.lat]
      const dLon = OKOLI_METRU / M_NA_STUPEN_LON
      const dLat = OKOLI_METRU / M_NA_STUPEN_LAT
      let nejblizsi: { metru: number; zona: PrvekZony } | undefined
      for (const zona of zony) {
        const [minLon, minLat, maxLon, maxLat] = zona.obalka
        if (
          bod[0] < minLon - dLon ||
          bod[0] > maxLon + dLon ||
          bod[1] < minLat - dLat ||
          bod[1] > maxLat + dLat
        ) {
          continue
        }
        const metru = vzdalenostKGeometrii(bod, zona.geometry)
        if (!nejblizsi || metru < nejblizsi.metru) nejblizsi = { metru, zona }
      }

      const vOkoli: ZonaMistnosti | undefined =
        nejblizsi && nejblizsi.metru <= OKOLI_METRU
          ? {
              metru: Math.round(nejblizsi.metru / 10) * 10,
              tarif: tarifRadky(nejblizsi.zona.properties.tariftext ?? ''),
              ...(nejblizsi.zona.properties.category
                ? { kategorie: nejblizsi.zona.properties.category }
                : {}),
            }
          : undefined
      zaznamy.push({
        mestskaCast: soubor.mestskaCast,
        adresa: m.adresa,
        ...(vOkoli ? { zona: vOkoli } : { zona: null }),
      })
    }
  }

  const vystup: ParkovaniMistnosti = {
    stazeno: new Date().toISOString().slice(0, 10),
    okoliMetru: OKOLI_METRU,
    zdroj: {
      nazev: 'Zóny placeného stání vymezené tarifem — otevřená data hl. m. Prahy (HMP-TSK)',
      url: URL_DATOVE_SADY,
      licence: 'CC BY',
    },
    mistnosti: zaznamy.sort(
      (a, b) =>
        a.mestskaCast.localeCompare(b.mestskaCast, 'cs') || a.adresa.localeCompare(b.adresa, 'cs'),
    ),
  }
  mkdirSync(join(CIL, '..'), { recursive: true })
  writeFileSync(CIL, JSON.stringify(vystup, null, 1) + '\n')

  const vZone = zaznamy.filter((z) => z.zona).length
  console.log(`Zapsáno ${zaznamy.length} místností, z toho ${vZone} se zónou do ${OKOLI_METRU} m.`)
  if (bezPolohy > 0) console.log(`Bez polohy: ${bezPolohy}.`)
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
