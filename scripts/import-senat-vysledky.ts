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
 * Druhé kolo: `prehled` má druhý řádek a sloupce 7 a 8 ve `vysledky` nesou
 * hlasy a procenta 2. kola (u nepostupujících nuly). Ověřeno 17. 10. 2026:
 * součet hlasů obou postupujících dává přesně platné hlasy 2. kola.
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

type Prehled = number[]

// prehled: [kolo, okrsky celkem, zpracováno, %, zapsaní, vydané obálky, účast %, …, odevzdané, platné, % platných]
function souhrnKola(cislo: number, kolo: number, p: Prehled | undefined) {
  if (!p) return null
  const [k, okrskyCelkem, okrskyZpracovano, , zapsaniVolici, vydaneObalky, ucastProcenta, , , platneHlasy] = p
  if (k !== kolo || okrskyZpracovano !== okrskyCelkem) {
    throw new Error(`Obvod ${cislo}: neočekávaný stav ${kolo}. kola (kolo ${k}, ${okrskyZpracovano}/${okrskyCelkem}).`)
  }
  return { okrskyCelkem: okrskyCelkem!, zapsaniVolici: zapsaniVolici!, vydaneObalky: vydaneObalky!, ucastProcenta: ucastProcenta!, platneHlasy: platneHlasy! }
}

function zkontrolujProcenta(cislo: number, kolo: number, procenta: number[]) {
  const soucet = procenta.reduce((n, x) => n + x, 0)
  if (Math.abs(soucet - 100) > 0.2) throw new Error(`Obvod ${cislo}, ${kolo}. kolo: procenta dávají ${soucet}.`)
}

async function main() {
  const nastaveni = await stahni<{ nastaveni: { KOLO: number } }>('nastaveni.json')
  const aktualniKolo = nastaveni.nastaveni.KOLO
  if (aktualniKolo !== 1 && aktualniKolo !== 2) throw new Error(`Aplikace hlásí ${aktualniKolo}. kolo.`)

  const predchozi = (() => {
    try {
      return JSON.parse(readFileSync(CIL, 'utf8')) as { obvody?: { cislo: number; kolo1: unknown }[] }
    } catch {
      return {}
    }
  })()

  const obvody = []
  for (const cislo of OBVODY) {
    const d = await stahni<Odpoved>(`vysled/obvod/${cislo}.json`)
    const souhrn1 = souhrnKola(cislo, 1, d.prehled[0])!
    const kandidati1 = d.vysledky.map((r) => ({ cislo: r[0], jmeno: r[1], navrhujici: r[2], hlasy: r[5], procenta: r[6] }))
    zkontrolujProcenta(cislo, 1, kandidati1.map((k) => k.procenta))

    const souhrn2 = aktualniKolo === 2 ? souhrnKola(cislo, 2, d.prehled[1]) : null
    // Bez druhého řádku přehledu se v obvodu 2. kolo nekonalo (vítěz už v 1. kole)
    // a z odpovědi platí jen 1. kolo.
    const postupuji1 = d.postupuje ?? []
    const zvolen1 = souhrn2 ? null : d.zvoleny
    if (zvolen1 === null && postupuji1.length !== 2) {
      throw new Error(`Obvod ${cislo}: bez vítěze, ale postupuje ${postupuji1.length} kandidátů.`)
    }

    let kolo2 = null
    if (souhrn2) {
      const kandidati2 = d.vysledky
        .filter((r) => postupuji1.includes(r[0]))
        .map((r) => ({ cislo: r[0], jmeno: r[1], navrhujici: r[2], hlasy: r[7] as number, procenta: r[8] as number }))
        .sort((a, b) => b.hlasy - a.hlasy)
      zkontrolujProcenta(cislo, 2, kandidati2.map((k) => k.procenta))
      const soucet = kandidati2.reduce((n, k) => n + k.hlasy, 0)
      if (soucet !== souhrn2.platneHlasy) {
        throw new Error(`Obvod ${cislo}: hlasy 2. kola (${soucet}) nesedí na platné (${souhrn2.platneHlasy}).`)
      }
      if (d.zvoleny !== kandidati2[0]!.cislo) {
        throw new Error(`Obvod ${cislo}: zvolený ${d.zvoleny} není kandidát s nejvíc hlasy ve 2. kole.`)
      }
      kolo2 = { generovano: d.generovano, ...souhrn2, kandidati: kandidati2, postupuji: [], zvolen: d.zvoleny }
    }

    // Čas generování 1. kola zůstává z prvního stažení, data 1. kola se v aplikaci nemění.
    const stare1 = predchozi.obvody?.find((x) => x.cislo === cislo)?.kolo1 as { generovano?: string } | undefined
    obvody.push({
      cislo,
      nazev: d.obvodNazev,
      kolo1: {
        generovano: (souhrn2 && stare1?.generovano) || d.generovano,
        ...souhrn1,
        kandidati: kandidati1.sort((a, b) => b.hlasy - a.hlasy),
        postupuji: postupuji1,
        zvolen: zvolen1,
      },
      kolo2,
    })
  }

  const vystup = { zdroj: 'Český statistický úřad, prezentační aplikace volbyhned.cz', obvody }
  writeFileSync(CIL, JSON.stringify(vystup, null, 1) + '\n')
  console.log(`Uloženo ${obvody.length} obvodů (${aktualniKolo}. kolo) → ${CIL}`)
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
