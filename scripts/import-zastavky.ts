/**
 * Nejbližší zastávka PID ke každé volební místnosti.
 *
 *   pnpm import:zastavky            # stáhne seznam zastávek a přepočítá
 *   pnpm import:zastavky --znovu    # ignoruje staženou kopii v tmp-import/
 *
 * Zdroj: otevřená data Pražské integrované dopravy (data.pid.cz), soubor
 * `stops/json/stops.json` — skupiny zastávek s nástupišti, jejich polohou,
 * linkami a údajem o bezbariérovém přístupu.
 *
 * Poloha místnosti se bere stejně jako na webu: z oznámení, když ho městská
 * část uvedla, jinak se adresa dohledá v adresních místech ČÚZK
 * (`data/okrsky/adresy/*.json`). Místnost bez polohy se přeskočí — hádat
 * zastávku podle názvu školy by bylo horší než neuvést nic.
 *
 * Vzdálenost je vzdušnou čarou, ne pěší trasa. Web to u čísla píše, protože
 * mezi místností a zastávkou může být kolejiště nebo svah.
 *
 * Výstup `data/mistnosti/zastavky.json` se commituje a čte ho
 * `src/lib/zastavky.ts`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { polohaAdresyVPraze, type Poloha } from '../src/lib/geokodovani'
import { adresyMestskeCasti } from '../src/lib/okrsky'
import type { AdresyMestskeCasti } from '../src/lib/okrskyHledani'
import type { ZastavkaMistnosti, ZastavkyMistnosti } from '../src/lib/zastavkyTypy'

const KOREN = join(__dirname, '..')
const CIL = join(KOREN, 'data/mistnosti/zastavky.json')
const CACHE = join(KOREN, 'tmp-import/pid/stops.json')
const URL_ZASTAVEK = 'https://data.pid.cz/stops/json/stops.json'
const ZNOVU = process.argv.includes('--znovu')

/** Dál než kilometr vzdušnou čarou už zastávka volič nezajímá a nejspíš je to chyba geokódování. */
const MAX_METRU = 1000

type StopPid = {
  lat: number
  lon: number
  wheelchairAccess?: 'possible' | 'notPossible' | 'unknown'
  mainTrafficType?: string
  lines?: { name: string; type: string }[]
}

type SkupinaPid = {
  name: string
  districtCode?: string
  municipality?: string
  stops: StopPid[]
}

type MistnostYaml = {
  mestskaCast: string
  mistnosti: { nazev: string; adresa: string; okrsky: number[]; poloha?: Poloha }[]
}

async function stahni(): Promise<{ generatedAt: string; stopGroups: SkupinaPid[] }> {
  if (!ZNOVU && existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, 'utf8'))
  const odpoved = await fetch(URL_ZASTAVEK)
  if (!odpoved.ok) throw new Error(`Stažení ${URL_ZASTAVEK} selhalo (${odpoved.status})`)
  const text = await odpoved.text()
  mkdirSync(join(CACHE, '..'), { recursive: true })
  writeFileSync(CACHE, text)
  return JSON.parse(text)
}

/** Vzdálenost vzdušnou čarou v metrech (haversine). */
function metru(a: Poloha, b: Poloha): number {
  const R = 6_371_000
  const f = Math.PI / 180
  const dLat = (b.lat - a.lat) * f
  const dLon = (b.lon - a.lon) * f
  const stred = (a.lat + b.lat) / 2 * f
  const x = dLon * Math.cos(stred)
  return Math.round(Math.sqrt(dLat * dLat + x * x) * R)
}

/** „9“, „22“, „A“ — čísla vzestupně, písmena metra napřed. */
function serad(linky: { nazev: string; typ: string }[]): { nazev: string; typ: string }[] {
  const poradi = (typ: string) => (typ === 'metro' ? 0 : typ === 'tram' ? 1 : typ === 'train' ? 2 : 3)
  return [...linky].sort((a, b) => {
    if (poradi(a.typ) !== poradi(b.typ)) return poradi(a.typ) - poradi(b.typ)
    const ca = Number(a.nazev)
    const cb = Number(b.nazev)
    if (Number.isFinite(ca) && Number.isFinite(cb)) return ca - cb
    return a.nazev.localeCompare(b.nazev, 'cs')
  })
}

function zastavkaProPolohu(poloha: Poloha, skupiny: SkupinaPid[]): ZastavkaMistnosti | undefined {
  let nejlepsi: { skupina: SkupinaPid; metru: number } | undefined
  for (const skupina of skupiny) {
    for (const nastupiste of skupina.stops) {
      const d = metru(poloha, { lat: nastupiste.lat, lon: nastupiste.lon })
      if (!nejlepsi || d < nejlepsi.metru) nejlepsi = { skupina, metru: d }
    }
  }
  if (!nejlepsi || nejlepsi.metru > MAX_METRU) return undefined

  const linky = new Map<string, { nazev: string; typ: string }>()
  let bezbarierovych = 0
  for (const nastupiste of nejlepsi.skupina.stops) {
    if (nastupiste.wheelchairAccess === 'possible') bezbarierovych++
    for (const linka of nastupiste.lines ?? []) {
      linky.set(`${linka.type}/${linka.name}`, { nazev: linka.name, typ: linka.type })
    }
  }
  return {
    nazev: nejlepsi.skupina.name,
    /** Zaokrouhleno na desítky metrů — přesnost zdroje ani geokódování na metry nestačí. */
    metru: Math.round(nejlepsi.metru / 10) * 10,
    linky: serad([...linky.values()]),
    ...(bezbarierovych > 0 ? { bezbarierovaZastavka: true } : {}),
  }
}

async function main() {
  const data = await stahni()
  const vPraze = data.stopGroups.filter(
    (s) => s.districtCode === 'AB' || s.municipality === 'Praha',
  )
  /**
   * Skupiny bez jediné linky jsou v datech PID zastávky, které se teprve staví
   * nebo se nepoužívají (Harfa, Morseova). Voliče by poslaly k zastávce, kde
   * nic nestaví, takže se při hledání nejbližší vynechávají.
   */
  const prazske = vPraze.filter((s) => s.stops.some((n) => (n.lines ?? []).length > 0))
  console.log(
    `Zastávky PID: ${data.stopGroups.length} skupin, v Praze ${vPraze.length}, ` +
      `z toho obsluhovaných ${prazske.length}.`,
  )

  const soubory: MistnostYaml[] = JSON.parse(
    readFileSync(join(KOREN, '.velite/volebniMistnosti.json'), 'utf8'),
  )
  const registry = new Map<string, AdresyMestskeCasti>()
  for (const soubor of soubory) {
    const adresy = adresyMestskeCasti(soubor.mestskaCast)
    if (adresy) registry.set(soubor.mestskaCast, adresy)
  }

  const zaznamy: ZastavkyMistnosti['mistnosti'] = []
  /** Táž adresa bývá v souboru vícekrát (jedna budova, víc okrsků) — zapisuje se jednou. */
  const videne = new Set<string>()
  let bezPolohy = 0
  let bezZastavky = 0
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
        console.log(`  bez polohy: ${soubor.mestskaCast} — ${m.adresa}`)
        continue
      }
      const zastavka = zastavkaProPolohu(poloha, prazske)
      if (!zastavka) {
        bezZastavky++
        continue
      }
      zaznamy.push({ mestskaCast: soubor.mestskaCast, adresa: m.adresa, zastavka })
    }
  }

  const vystup: ZastavkyMistnosti = {
    stazeno: new Date().toISOString().slice(0, 10),
    zdroj: {
      nazev: 'Pražská integrovaná doprava — seznam zastávek (otevřená data)',
      url: URL_ZASTAVEK,
      generovano: data.generatedAt,
    },
    mistnosti: zaznamy.sort(
      (a, b) => a.mestskaCast.localeCompare(b.mestskaCast, 'cs') || a.adresa.localeCompare(b.adresa, 'cs'),
    ),
  }
  mkdirSync(join(CIL, '..'), { recursive: true })
  writeFileSync(CIL, JSON.stringify(vystup, null, 1) + '\n')

  console.log(`Zapsáno ${zaznamy.length} místností.`)
  if (bezPolohy > 0) console.log(`Bez polohy (adresa se nenašla v registru): ${bezPolohy}.`)
  if (bezZastavky > 0) console.log(`Bez zastávky do ${MAX_METRU} m: ${bezZastavky}.`)
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
