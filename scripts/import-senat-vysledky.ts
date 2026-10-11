/**
 * Výsledky senátních voleb 2026 ve třech pražských obvodech.
 *
 *   pnpm import:senat-vysledky
 *
 * Bere JSON prezentační aplikace ČSÚ (volbyhned.cz) — stejný zdroj jako
 * konečné výsledky komunálních voleb. Pole jsou poziční; význam je ověřený
 * proti zveřejněným výsledkům 1. kola (ČT24, 10. 10. 2026) a hlídá ho
 * kontrola níže: součet procent ~100 a dva postupující u obvodu bez vítěze.
 *
 * Druhé kolo: aplikace přepne `nastaveni.KOLO` na 2. Formát výsledků 2. kola
 * zatím neznáme, proto ho skript odmítne zapsat, dokud se neověří.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KOREN = join(__dirname, '..')
const CIL = join(KOREN, 'data/senat/vysledky.json')
const ZAKLAD = 'https://www.volbyhned.cz/appdata/senat/20261009'
const OBVODY = [21, 24, 27]

type Radek = [number, string, string, string, string, number, number, ...unknown[]]
type Odpoved = {
  generovano: string
  obvodNazev: string
  prehled: number[][]
  vysledky: Radek[]
  postupuje: number[] | null
  zvoleny: number | null
}

async function stahni<T>(cesta: string): Promise<T> {
  const odpoved = await fetch(`${ZAKLAD}/${cesta}`, { signal: AbortSignal.timeout(30_000) })
  if (!odpoved.ok) throw new Error(`HTTP ${odpoved.status} pro ${cesta}`)
  return (await odpoved.json()) as T
}

async function main() {
  const nastaveni = await stahni<{ nastaveni: { KOLO: number } }>('nastaveni.json')
  if (nastaveni.nastaveni.KOLO !== 1) {
    throw new Error(`Aplikace hlásí ${nastaveni.nastaveni.KOLO}. kolo — formát je potřeba nejdřív ověřit.`)
  }

  const obvody = []
  for (const cislo of OBVODY) {
    const d = await stahni<Odpoved>(`vysled/obvod/${cislo}.json`)
    const p = d.prehled[0]!
    // prehled: [kolo, okrsky celkem, zpracováno, %, zapsaní, vydané obálky, účast %, …, odevzdané, platné, % platných]
    const [kolo, okrskyCelkem, okrskyZpracovano, , zapsaniVolici, vydaneObalky, ucastProcenta, , , platneHlasy] = p
    if (kolo !== 1 || okrskyZpracovano !== okrskyCelkem) {
      throw new Error(`Obvod ${cislo}: neočekávaný stav (kolo ${kolo}, ${okrskyZpracovano}/${okrskyCelkem}).`)
    }
    const kandidati = d.vysledky.map((r) => ({
      cislo: r[0],
      jmeno: r[1],
      navrhujici: r[2],
      hlasy: r[5],
      procenta: r[6],
    }))
    const soucet = kandidati.reduce((n, k) => n + k.procenta, 0)
    if (Math.abs(soucet - 100) > 0.2) throw new Error(`Obvod ${cislo}: procenta dávají ${soucet}.`)
    if (d.zvoleny === null && d.postupuje?.length !== 2) {
      throw new Error(`Obvod ${cislo}: bez vítěze, ale postupuje ${d.postupuje?.length ?? 0} kandidátů.`)
    }
    obvody.push({
      cislo,
      nazev: d.obvodNazev,
      kolo1: {
        generovano: d.generovano,
        okrskyCelkem,
        zapsaniVolici,
        vydaneObalky,
        ucastProcenta,
        platneHlasy,
        kandidati: kandidati.sort((a, b) => b.hlasy - a.hlasy),
        postupuji: d.postupuje ?? [],
        zvolen: d.zvoleny,
      },
    })
  }

  // Zachová případná ručně neměněná pole budoucích kol — zatím jen 1. kolo.
  const predchozi = (() => {
    try {
      return JSON.parse(readFileSync(CIL, 'utf8')) as { obvody?: { cislo: number; kolo2?: unknown }[] }
    } catch {
      return {}
    }
  })()
  const vystup = {
    zdroj: 'Český statistický úřad, prezentační aplikace volbyhned.cz',
    obvody: obvody.map((o) => ({ ...o, kolo2: predchozi.obvody?.find((x) => x.cislo === o.cislo)?.kolo2 ?? null })),
  }
  writeFileSync(CIL, JSON.stringify(vystup, null, 1) + '\n')
  console.log(`Uloženo ${obvody.length} obvodů → ${CIL}`)
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
