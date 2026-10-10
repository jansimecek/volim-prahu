import {
  DATUM_VOLEB,
  overUplnost,
  SADA,
  type Snapshot,
  type StranaVysledek,
  type ZastupitelstvoVysledek,
} from './vysledky'

/**
 * Záložní zdroj výsledků: JSON prezentační aplikace ČSÚ na volbyhned.cz.
 *
 * Když volby.gov.cz padne pod náporem, ČSÚ místo XML vrací stránku
 * o nedostupnosti a odkazuje na volbyhned.cz. Ten nemá hromadný XML výstup,
 * jen JSON pro vlastní aplikaci — jeden soubor na zastupitelstvo. Formát není
 * dokumentovaný; význam polí je ověřený proti známým výsledkům roku 2022
 * (`pnpm nacvik`) a hlídá ho test se vzorkem.
 */

/** Okres Hlavní město Praha v číselníku prezentační aplikace. */
export const OKRES_PRAHA = '1100'

/** Pod tímhle počtem znaků bereme plný název strany, jinak zkrácený. */
const MAX_DELKA_NAZVU = 80

/** Kolik souborů stahujeme naráz — šetrně k ČSÚ, a přitom pod limitem funkce. */
const SOUBEZNOST = 8

export function urlZastupitelstva(kod: string, sada = SADA, datum = DATUM_VOLEB): string {
  return `https://www.volbyhned.cz/appdata/${sada}/${datum}/vysled/${OKRES_PRAHA}/${kod}.json`
}

/**
 * Pole `prehled` je poziční — indexy ověřené proti roku 2022:
 * mandáty, obvody, okrsky celkem, okrsky zpracované, % okrsků, zapsaní voliči,
 * vydané obálky, účast %, …, platné hlasy na indexu 12.
 */
const P = {
  mandatu: 0,
  okrskyCelkem: 2,
  okrskyZpracovano: 3,
  okrskyProcenta: 4,
  zapsaniVolici: 5,
  vydaneObalky: 6,
  ucastProcenta: 7,
  platneHlasy: 12,
} as const

/**
 * Řádek strany: [číslo, zkrácený název, hlasy, %, kandidátů, …, mandáty na
 * indexu 7]. Během sčítání chodí jen prvních pět prvků — mandáty pak 0.
 */
const S = { cislo: 0, nazev: 1, hlasy: 2, procenta: 3, kandidatu: 4, mandaty: 7 } as const

const cislo = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export function parsujZastupitelstvo(
  data: unknown,
  kod: string,
  slug: string,
): ZastupitelstvoVysledek & { generovano: string } {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const param = (d.param ?? {}) as Record<string, unknown>
  const prehled = d.prehled
  const vysledky = d.vysledky

  if (String(param.kodzastup) !== kod) {
    throw new Error(`Soubor volbyhned.cz pro ${kod} patří jinému zastupitelstvu (${String(param.kodzastup)}).`)
  }
  if (!Array.isArray(prehled) || prehled.length <= P.platneHlasy || !Array.isArray(vysledky)) {
    throw new Error(`Soubor volbyhned.cz pro ${kod} má neznámý tvar.`)
  }

  const plneNazvy = new Map<number, string>()
  if (Array.isArray(d.plne_nazvy_stran)) {
    for (const radek of d.plne_nazvy_stran) {
      if (Array.isArray(radek) && typeof radek[1] === 'string') plneNazvy.set(cislo(radek[0]), radek[1])
    }
  }

  const strany: StranaVysledek[] = vysledky
    .filter((r): r is unknown[] => Array.isArray(r))
    .map((r) => {
      const c = cislo(r[S.cislo])
      // Plné názvy občas obsahují celé volební heslo — ty nahradí zkrácený.
      const plny = plneNazvy.get(c)
      return {
        cislo: c,
        // Kód strany (VSTRANA) JSON neposílá.
        kod: '',
        nazev: plny && plny.length <= MAX_DELKA_NAZVU ? plny : String(r[S.nazev] ?? ''),
        hlasy: cislo(r[S.hlasy]),
        procenta: cislo(r[S.procenta]),
        kandidatu: cislo(r[S.kandidatu]),
        mandaty: cislo(r[S.mandaty]),
      }
    })
    .sort((a, b) => b.procenta - a.procenta)

  return {
    kod,
    nazev: String(d.obecNazev ?? ''),
    slug,
    mandatuCelkem: cislo(prehled[P.mandatu]),
    spocteno: d.zvoleno === true,
    okrskyCelkem: cislo(prehled[P.okrskyCelkem]),
    okrskyZpracovano: cislo(prehled[P.okrskyZpracovano]),
    okrskyProcenta: cislo(prehled[P.okrskyProcenta]),
    zapsaniVolici: cislo(prehled[P.zapsaniVolici]),
    vydaneObalky: cislo(prehled[P.vydaneObalky]),
    ucastProcenta: cislo(prehled[P.ucastProcenta]),
    platneHlasy: cislo(prehled[P.platneHlasy]),
    strany,
    generovano: String(d.generovano ?? ''),
  }
}

/**
 * Stáhne všech 58 zastupitelstev z volbyhned.cz. Jediný chybějící soubor
 * shodí celé stažení — neúplný snapshot nesmí přepsat poslední dobrý.
 */
export async function stahniVysledkyVolbyhned(
  slugPodleKodu: Map<string, string>,
  sada = SADA,
  datum = DATUM_VOLEB,
  signal: AbortSignal = AbortSignal.timeout(40_000),
): Promise<Snapshot> {
  const kody = [...slugPodleKodu.keys()]
  const vysledky: (ZastupitelstvoVysledek & { generovano: string })[] = []

  for (let i = 0; i < kody.length; i += SOUBEZNOST) {
    const davka = await Promise.all(
      kody.slice(i, i + SOUBEZNOST).map(async (kod) => {
        const odpoved = await fetch(urlZastupitelstva(kod, sada, datum), {
          headers: { accept: 'application/json' },
          signal,
          cache: 'no-store',
        })
        if (!odpoved.ok) throw new Error(`volbyhned.cz vrátil HTTP ${odpoved.status} pro ${kod}`)
        return parsujZastupitelstvo(await odpoved.json(), kod, slugPodleKodu.get(kod) ?? kod)
      }),
    )
    vysledky.push(...davka)
  }

  // Soubory se generují každý zvlášť a ten, ve kterém se nic nesečetlo, ČSÚ
  // nepřegenerovává — nejstarší čas by tak ukazoval na den před volbami.
  // Stav celého snapshotu proto popisuje nejnovější čas. Stáří dat hlídá
  // stránka podle času stažení, ne podle tohohle údaje.
  const generovano = vysledky.map((z) => z.generovano).sort().at(-1) ?? ''
  const snapshot: Snapshot = {
    generovano,
    stazeno: new Date().toISOString(),
    sada,
    zdroj: 'volbyhned',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    zastupitelstva: vysledky.map(({ generovano: _generovano, ...z }) => z),
  }
  overUplnost(snapshot)
  return snapshot
}
