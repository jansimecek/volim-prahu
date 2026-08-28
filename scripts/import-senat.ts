/**
 * Import kandidátů do Senátu z otevřených dat ČSÚ.
 *
 *   pnpm import:senat
 *
 * Sada se2026, soubor serk.csv. Filtrujeme tři pražské obvody, ve kterých
 * se letos volí. Stejně jako u komunálních dat se spouští ručně a výsledek
 * se commituje, aby bylo v Gitu vidět, co se změnilo.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { unzipSync } from 'fflate'
import { parseCsvObjects } from '../src/lib/csv'
import { slugKandidata } from '../src/lib/slug'

const KOREN = join(__dirname, '..')
const CIL = join(KOREN, 'data/senat/kandidati.json')

/** Obvody, ve kterých se v Praze v roce 2026 volí. */
const PRAZSKE_OBVODY = ['21', '24', '27']

async function najdiRegistr(rok: number): Promise<string | null> {
  const zaklad = `https://volby.gov.cz/opendata/se${rok}/`
  const odpoved = await fetch(`${zaklad}se${rok}_opendata.htm`)
  if (!odpoved.ok) return null
  const soubor = (await odpoved.text()).match(new RegExp(`SE${rok}reg\\d+_csv\\.zip`))?.[0]
  return soubor ? `${zaklad}${soubor}` : null
}

type KandidatSenat = {
  obvod: number
  cislo: number
  slug: string
  jmeno: string
  prijmeni: string
  titulPred: string
  titulZa: string
  vek: number
  povolani: string
  bydliste: string
  navrhujiciStrana: string
  politickaPrislusnost: string
  /** Název volební strany tak, jak je na hlasovacím lístku. */
  volebniStrana: string
}

async function main() {
  const rok = Number(process.argv[process.argv.indexOf('--rok') + 1]) || 2026
  const url = await najdiRegistr(rok)
  if (!url) {
    console.error(`Sada se${rok} zatím na volby.gov.cz/opendata není. Nic se nepřepisuje.`)
    process.exitCode = 1
    return
  }

  console.log(`Stahuji ${url} …`)
  const odpoved = await fetch(url)
  if (!odpoved.ok) throw new Error(`Stažení selhalo (${odpoved.status})`)
  const zip = unzipSync(new Uint8Array(await odpoved.arrayBuffer()))
  const soubor = zip['csv_od/serk.csv']
  if (!soubor) throw new Error('V archivu chybí csv_od/serk.csv')

  const vsichni = parseCsvObjects(new TextDecoder('utf-8').decode(soubor))
  const obsazene = new Set<string>()

  const kandidati: KandidatSenat[] = vsichni
    .filter((r) => PRAZSKE_OBVODY.includes(r.OBVOD ?? ''))
    .sort(
      (a, b) => Number(a.OBVOD) - Number(b.OBVOD) || Number(a.CKAND) - Number(b.CKAND),
    )
    .map((r) => ({
      obvod: Number(r.OBVOD ?? 0),
      cislo: Number(r.CKAND ?? 0),
      slug: slugKandidata(r.PRIJMENI ?? '', r.JMENO ?? '', obsazene),
      jmeno: r.JMENO ?? '',
      prijmeni: r.PRIJMENI ?? '',
      titulPred: r.TITULPRED ?? '',
      titulZa: r.TITULZA ?? '',
      vek: Number(r.VEK ?? 0),
      povolani: r.POVOLANI ?? '',
      // Publikujeme jen v rozsahu, v jakém bydliště zveřejňuje ČSÚ.
      bydliste: r.BYDLISTEN ?? '',
      navrhujiciStrana: r.NSTRANA ?? '',
      politickaPrislusnost: r.PSTRANA ?? '',
      volebniStrana: r.NAZEV_VS ?? '',
    }))

  mkdirSync(join(CIL, '..'), { recursive: true })
  const data = {
    sada: `se${rok}`,
    stazeno: new Date().toISOString().slice(0, 10),
    kandidati,
  }
  const novy = JSON.stringify(data, null, 2) + '\n'
  const zmena = !existsSync(CIL) || readFileSync(CIL, 'utf8') !== novy
  writeFileSync(CIL, novy)

  console.log(`${zmena ? 'Zapsáno' : 'Beze změny'}: ${kandidati.length} kandidátů`)
  for (const obvod of PRAZSKE_OBVODY) {
    const v = kandidati.filter((k) => k.obvod === Number(obvod))
    console.log(`  obvod ${obvod}: ${v.length} kandidátů`)
  }
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
