/**
 * Import volebních okrsků Prahy z otevřených dat ČÚZK.
 *
 *   pnpm import:okrsky                 # sestavy adres i hranice
 *   pnpm import:okrsky --bez-hranic    # jen adresy (rychlé; hranice zůstanou)
 *   pnpm import:okrsky --datum 20260903  # konkrétní stav speciálního VFR
 *   pnpm import:okrsky --znovu         # ignorovat stažené soubory v tmp-import/
 *
 * Zdroje (obojí otevřená data ČÚZK, viz src/lib/ruian.ts):
 *  - sestavy „Seznam adresních míst s volebními okrsky" — jeden ZIP na městskou
 *    část, kód MOMC = kód zastupitelstva v číselníku ČSÚ,
 *  - speciální VFR ST_UVOH — hranice a definiční body všech okrsků v ČR,
 *    generuje se ke 3. dni v měsíci.
 *
 * Výstup v data/okrsky/ (commituje se):
 *  - prehled.json           1 120 okrsků: číslo, MČ, střed, počet adres
 *  - adresy/<mč>.json       adresní místa MČ → okrsek (kompaktní pole)
 *  - hranice/<mč>.geojson   polygony okrsků ve WGS84
 *
 * Stažené archivy se cachují v tmp-import/okrsky/ (gitignore), aby se při
 * opakovaném běhu netahalo 50 MB VFR znovu.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { unzipSync } from 'fflate'
import { sjtskNaWgs84, zaokrouhli } from '../src/lib/krovak'
import type { AdresyMestskeCasti, HraniceOkrsku, Okrsek, PrehledOkrsku, RadekAdresy } from '../src/lib/okrsky'
import {
  dekodujCp1250,
  geometrieOkrsku,
  okrskyZeSpecialnihoVfr,
  oznaceniCisla,
  parseSestavuVO,
  type AdresniMisto,
} from '../src/lib/ruian'
import { KOD_MAGISTRAT } from '../src/lib/slug'
import type { Zastupitelstvo } from '../src/lib/typy'

const KOREN = join(__dirname, '..')
const CIL = join(KOREN, 'data/okrsky')
const CACHE = join(KOREN, 'tmp-import/okrsky')

const URL_SESTAV = 'https://services.cuzk.cz/sestavy/VO/'
const URL_VFR = 'https://vdp.cuzk.cz/vymenny_format/specialni/'

const argumenty = process.argv.slice(2)
const BEZ_HRANIC = argumenty.includes('--bez-hranic')
const ZNOVU = argumenty.includes('--znovu')
const DATUM_VFR = argumenty[argumenty.indexOf('--datum') + 1]

const ZDROJE = [
  { nazev: 'ČÚZK — Seznam adresních míst s volebními okrsky (sestavy VO)', url: URL_SESTAV },
  { nazev: 'ČÚZK — Speciální výměnný formát RÚIAN, volební okrsky (ST_UVOH)', url: URL_VFR },
]

async function stahni(url: string, cesta: string): Promise<Uint8Array> {
  if (!ZNOVU && existsSync(cesta)) return new Uint8Array(readFileSync(cesta))
  const odpoved = await fetch(url)
  if (!odpoved.ok) throw new Error(`Stažení ${url} selhalo (${odpoved.status})`)
  const data = new Uint8Array(await odpoved.arrayBuffer())
  mkdirSync(join(cesta, '..'), { recursive: true })
  writeFileSync(cesta, data)
  return data
}

function zapisJson(cesta: string, obsah: unknown): 'zapsáno' | 'beze změny' {
  mkdirSync(join(cesta, '..'), { recursive: true })
  const novy = JSON.stringify(obsah) + '\n'
  const zmena = !existsSync(cesta) || readFileSync(cesta, 'utf8') !== novy
  if (zmena) writeFileSync(cesta, novy)
  return zmena ? 'zapsáno' : 'beze změny'
}

function vRozsahu(cislo: number, z: Zastupitelstvo): boolean {
  return z.rozsahyOkrsku.some((r) => cislo >= r.od && cislo <= r.do)
}

/** Ke kterému měsíci má vyjít poslední ST_UVOH: 3. den měsíce, soubor vzniká v noci na 4. */
function kandidatiDatumVfr(): string[] {
  const dnes = new Date()
  const vysledek: string[] = []
  for (let zpet = 0; zpet < 4; zpet++) {
    const d = new Date(Date.UTC(dnes.getUTCFullYear(), dnes.getUTCMonth() - zpet, 3))
    if (zpet === 0 && dnes.getUTCDate() < 4) continue
    vysledek.push(d.toISOString().slice(0, 10).replace(/-/g, ''))
  }
  return vysledek
}

async function najdiVfr(): Promise<string> {
  if (DATUM_VFR) return DATUM_VFR
  for (const datum of kandidatiDatumVfr()) {
    if (!ZNOVU && existsSync(join(CACHE, `${datum}_ST_UVOH.xml.zip`))) return datum
    const odpoved = await fetch(`${URL_VFR}${datum}_ST_UVOH.xml.zip`, { method: 'HEAD' })
    if (odpoved.ok) return datum
  }
  throw new Error('Na vdp.cuzk.cz se nepodařilo najít žádný ST_UVOH za poslední čtyři měsíce.')
}

type Sestava = { mc: Zastupitelstvo; adresy: AdresniMisto[] }

async function nactiSestavy(mestskeCasti: Zastupitelstvo[]): Promise<Sestava[]> {
  const sestavy: Sestava[] = []
  for (const mc of mestskeCasti) {
    const zip = unzipSync(await stahni(`${URL_SESTAV}${mc.kod}.zip`, join(CACHE, 'VO', `${mc.kod}.zip`)))
    const csv = Object.entries(zip).find(([nazev]) => nazev.toLowerCase().endsWith('.csv'))?.[1]
    if (!csv) throw new Error(`V archivu ${mc.kod}.zip není žádné CSV`)
    sestavy.push({ mc, adresy: parseSestavuVO(dekodujCp1250(csv)) })
  }
  return sestavy
}

function sestavAdresy(sestava: Sestava, stazeno: string): AdresyMestskeCasti {
  const ulice: Record<string, RadekAdresy[]> = {}
  for (const a of sestava.adresy) {
    if (a.okrsek === null || !a.poloha) continue
    ;(ulice[a.ulice] ??= []).push([
      oznaceniCisla(a),
      a.okrsek,
      a.adm,
      zaokrouhli(a.poloha.lat),
      zaokrouhli(a.poloha.lon),
    ])
  }
  const serazene = Object.fromEntries(
    Object.keys(ulice)
      .sort((a, b) => a.localeCompare(b, 'cs'))
      .map((nazev) => [
        nazev,
        ulice[nazev]!.sort((a, b) => parseInt(a[0].replace('č.ev. ', ''), 10) - parseInt(b[0].replace('č.ev. ', ''), 10) || a[0].localeCompare(b[0], 'cs')),
      ]),
  )
  return {
    mestskaCast: sestava.mc.slug,
    kodMomc: sestava.mc.kod,
    stazeno,
    sloupce: ['cislo', 'okrsek', 'adm', 'lat', 'lon'],
    ulice: serazene,
  }
}

async function main() {
  const ciselnik = JSON.parse(readFileSync(join(KOREN, 'data/ciselniky/zastupitelstva.json'), 'utf8')) as {
    zastupitelstva: Zastupitelstvo[]
  }
  const mestskeCasti = ciselnik.zastupitelstva.filter((z) => !z.jeMagistrat)
  const slugPodleMomc = new Map(mestskeCasti.map((z) => [z.kod, z.slug]))
  const stazeno = new Date().toISOString().slice(0, 10)

  console.log(`Sestavy VO pro ${mestskeCasti.length} městských částí …`)
  const sestavy = await nactiSestavy(mestskeCasti)

  const adresPodleOkrsku = new Map<number, number>()
  let celkemAdres = 0
  let bezOkrsku = 0
  const cizi: string[] = []
  const nesouhlasi: string[] = []
  for (const sestava of sestavy) {
    const okrsky = new Set<number>()
    for (const a of sestava.adresy) {
      celkemAdres++
      if (a.okrsek === null || !a.poloha) {
        bezOkrsku++
        continue
      }
      adresPodleOkrsku.set(a.okrsek, (adresPodleOkrsku.get(a.okrsek) ?? 0) + 1)
      if (vRozsahu(a.okrsek, sestava.mc)) okrsky.add(a.okrsek)
      else cizi.push(`${sestava.mc.nazev}: ${a.ulice} ${oznaceniCisla(a)} → okrsek ${a.okrsek}`)
    }
    if (okrsky.size !== sestava.mc.okrskyCelkem) {
      nesouhlasi.push(`${sestava.mc.nazev}: ČSÚ ${sestava.mc.okrskyCelkem}, v adresách ${okrsky.size}`)
    }
    const stav = zapisJson(join(CIL, 'adresy', `${sestava.mc.slug}.json`), sestavAdresy(sestava, stazeno))
    if (stav === 'zapsáno') console.log(`  adresy/${sestava.mc.slug}.json — ${sestava.adresy.length} adres`)
  }
  console.log(`Celkem ${celkemAdres} adresních míst, ${bezOkrsku} bez okrsku nebo bez polohy (evidenční čísla bez souřadnic).`)
  if (cizi.length > 0) {
    console.log(`\nAdresy přiřazené do okrsku jiné městské části (tak to má RÚIAN, necháváme):`)
    for (const c of cizi) console.log(`  ${c}`)
  }
  if (nesouhlasi.length > 0) {
    console.log(`\nPočet okrsků v adresách nesedí na číselník ČSÚ:`)
    for (const n of nesouhlasi) console.log(`  ${n}`)
  }

  const cestaPrehledu = join(CIL, 'prehled.json')
  const stary = existsSync(cestaPrehledu) ? (JSON.parse(readFileSync(cestaPrehledu, 'utf8')) as PrehledOkrsku) : null
  let okrsky: Okrsek[]
  let stavHranic: string

  if (BEZ_HRANIC) {
    if (!stary) throw new Error('--bez-hranic potřebuje existující data/okrsky/prehled.json')
    stavHranic = stary.stavHranic
    okrsky = stary.okrsky.map((o) => ({ ...o, adres: adresPodleOkrsku.get(o.cislo) ?? 0 }))
    console.log(`\nHranice se nestahují, přehled se skládá ze stávajícího (stav ${stavHranic}).`)
  } else {
    const datum = await najdiVfr()
    stavHranic = `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`
    console.log(`\nSpeciální VFR ${datum}_ST_UVOH.xml.zip …`)
    const zip = unzipSync(await stahni(`${URL_VFR}${datum}_ST_UVOH.xml.zip`, join(CACHE, `${datum}_ST_UVOH.xml.zip`)))
    const xml = Object.values(zip)[0]
    if (!xml) throw new Error('Archiv ST_UVOH je prázdný')
    const vfr = okrskyZeSpecialnihoVfr(new TextDecoder('utf-8').decode(xml), KOD_MAGISTRAT).sort(
      (a, b) => a.cislo - b.cislo,
    )
    console.log(`  ${vfr.length} pražských okrsků s hranicí`)

    okrsky = vfr.map((o) => {
      const stred = sjtskNaWgs84(o.stred.x, o.stred.y)
      return {
        cislo: o.cislo,
        kod: o.kod,
        mestskaCast: slugPodleMomc.get(o.kodMomc) ?? o.kodMomc,
        kodMomc: o.kodMomc,
        adres: adresPodleOkrsku.get(o.cislo) ?? 0,
        stred: [zaokrouhli(stred.lon), zaokrouhli(stred.lat)],
        platiOd: o.platiOd,
        ...(o.poznamka ? { poznamka: o.poznamka } : {}),
      }
    })

    for (const mc of mestskeCasti) {
      const hranice: HraniceOkrsku = {
        type: 'FeatureCollection',
        features: vfr
          .filter((o) => o.kodMomc === mc.kod)
          .map((o) => ({
            type: 'Feature',
            properties: { cislo: o.cislo, kod: o.kod, mestskaCast: mc.slug },
            geometry: geometrieOkrsku(o.polygony),
          })),
      }
      if (hranice.features.length !== mc.okrskyCelkem) {
        nesouhlasi.push(`${mc.nazev}: ČSÚ ${mc.okrskyCelkem}, hranic ve VFR ${hranice.features.length}`)
      }
      zapisJson(join(CIL, 'hranice', `${mc.slug}.geojson`), hranice)
    }
    const neznameMomc = okrsky.filter((o) => !slugPodleMomc.has(o.kodMomc))
    if (neznameMomc.length > 0) {
      console.log(`\nOkrsky s MOMC mimo číselník: ${neznameMomc.map((o) => `${o.cislo} (${o.kodMomc})`).join(', ')}`)
    }
  }

  const prehled: PrehledOkrsku = { stazeno, stavHranic, zdroje: ZDROJE, okrsky }
  const magistrat = ciselnik.zastupitelstva.find((z) => z.jeMagistrat)
  const stav = zapisJson(cestaPrehledu, prehled)
  console.log(`\n${stav}: data/okrsky/prehled.json — ${okrsky.length} okrsků (ČSÚ uvádí ${magistrat?.okrskyCelkem ?? '?'})`)
  const bezAdres = okrsky.filter((o) => o.adres === 0).map((o) => o.cislo)
  if (bezAdres.length > 0) console.log(`Okrsky bez jediné adresy: ${bezAdres.join(', ')}`)
  const sPoznamkou = okrsky.filter((o) => o.poznamka?.startsWith('Volební místnost')).length
  console.log(`Okrsky s adresou místnosti v poznámce RÚIAN: ${sPoznamkou}`)
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
