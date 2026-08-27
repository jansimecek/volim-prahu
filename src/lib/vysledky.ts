import { XMLParser } from 'fast-xml-parser'

/**
 * Výsledky voleb z otevřených dat ČSÚ.
 *
 * Jeden požadavek vrací celou Prahu — všech 58 zastupitelstev včetně účasti,
 * hlasů a mandátů. Volá se výhradně z cronu, nikdy z požadavku uživatele:
 * ve volební noc by ČSÚ padlo pod náporem a s ním i naše stránka.
 */

/** Volby do zastupitelstev obcí 2026, první den. */
export const DATUM_VOLEB = '20261009'
export const SADA = 'kv2026'
export const NUTS_PRAHA = 'CZ0100'

export function urlVysledku(sada = SADA, datum = DATUM_VOLEB, nuts = NUTS_PRAHA): string {
  return `https://volby.gov.cz/pls/${sada}/vysledky_obce_okres?datumvoleb=${datum}&nuts=${nuts}`
}

export type StranaVysledek = {
  cislo: number
  kod: string
  nazev: string
  hlasy: number
  procenta: number
  kandidatu: number
  mandaty: number
}

export type ZastupitelstvoVysledek = {
  kod: string
  nazev: string
  slug: string
  mandatuCelkem: number
  spocteno: boolean
  okrskyCelkem: number
  okrskyZpracovano: number
  okrskyProcenta: number
  zapsaniVolici: number
  vydaneObalky: number
  ucastProcenta: number
  platneHlasy: number
  strany: StranaVysledek[]
}

export type Snapshot = {
  /** Kdy data vygeneroval ČSÚ. */
  generovano: string
  /** Kdy jsme je úspěšně stáhli. */
  stazeno: string
  sada: string
  zastupitelstva: ZastupitelstvoVysledek[]
}

/** Odpověď ČSÚ po naparsování — atributy chodí jako řetězce. */
type XmlUzel = Record<string, unknown>

const uzel = (v: unknown): XmlUzel => (v && typeof v === 'object' ? (v as XmlUzel) : {})

const cislo = (v: unknown): number => {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const doPole = <T,>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

/**
 * Slug zastupitelstva bereme z číselníku, ne z názvu ve výsledcích — názvy se
 * mezi sadami drobně liší a rozejít se nesmí.
 */
export function parsujVysledky(
  xml: string,
  slugPodleKodu: Map<string, string>,
  sada = SADA,
): Snapshot {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseAttributeValue: false,
  })
  const data = parser.parse(xml) as XmlUzel
  const koren = uzel(data.VYSLEDKY_OBCE_OKRES)
  if (!data.VYSLEDKY_OBCE_OKRES) {
    throw new Error('Odpověď ČSÚ nemá kořen VYSLEDKY_OBCE_OKRES.')
  }

  const zastupitelstva: ZastupitelstvoVysledek[] = doPole(koren.OBEC).map((surovy) => {
    const obec = uzel(surovy)
    const vysledek = uzel(obec.VYSLEDEK)
    const ucast = uzel(vysledek.UCAST)
    const kod = String(obec.KODZASTUP ?? '')
    return {
      kod,
      nazev: String(obec.NAZEVZAST ?? ''),
      slug: slugPodleKodu.get(kod) ?? kod,
      mandatuCelkem: cislo(obec.VOLENO_ZASTUP),
      // ČSÚ posílá "true"/"false" jako řetězec.
      spocteno: String(obec.JE_SPOCTENO) === 'true',
      okrskyCelkem: cislo(ucast.OKRSKY_CELKEM),
      okrskyZpracovano: cislo(ucast.OKRSKY_ZPRAC),
      okrskyProcenta: cislo(ucast.OKRSKY_ZPRAC_PROC),
      zapsaniVolici: cislo(ucast.ZAPSANI_VOLICI),
      vydaneObalky: cislo(ucast.VYDANE_OBALKY),
      ucastProcenta: cislo(ucast.UCAST_PROC),
      // Pozor: v komunálních volbách má volič tolik hlasů, kolik je mandátů,
      // takže tohle číslo není počet voličů.
      platneHlasy: cislo(ucast.PLATNE_HLASY),
      strany: doPole(vysledek.VOLEBNI_STRANA)
        .map((surovaStrana) => {
          const s = uzel(surovaStrana)
          return {
            cislo: cislo(s.POR_STR_HLAS_LIST),
            kod: String(s.VSTRANA ?? ''),
            nazev: String(s.NAZEV_STRANY ?? ''),
            hlasy: cislo(s.HLASY),
            procenta: cislo(s.HLASY_PROC),
            kandidatu: cislo(s.KANDIDATU_POCET),
            mandaty: cislo(s.ZASTUPITELE_POCET),
          }
        })
        .sort((a, b) => b.procenta - a.procenta),
    }
  })

  if (zastupitelstva.length === 0) {
    throw new Error('Odpověď ČSÚ neobsahuje žádné zastupitelstvo.')
  }

  return {
    generovano: String(koren.DATUM_CAS_GENEROVANI ?? ''),
    stazeno: new Date().toISOString(),
    sada,
    zastupitelstva,
  }
}

/** Stáhne a naparsuje výsledky. Volá jen cron, nikdy stránka. */
export async function stahniVysledky(
  slugPodleKodu: Map<string, string>,
  sada = SADA,
  datum = DATUM_VOLEB,
): Promise<Snapshot> {
  const odpoved = await fetch(urlVysledku(sada, datum), {
    headers: { accept: 'application/xml, text/xml' },
    signal: AbortSignal.timeout(45_000),
    cache: 'no-store',
  })
  if (!odpoved.ok) throw new Error(`ČSÚ vrátil HTTP ${odpoved.status}`)
  return parsujVysledky(await odpoved.text(), slugPodleKodu, sada)
}

/** Kolik procent okrsků je sečteno napříč celou Prahou. */
export function celkovyPostup(snapshot: Snapshot): {
  zpracovano: number
  celkem: number
  procenta: number
} {
  const magistrat = snapshot.zastupitelstva.find((z) => z.kod === '554782')
  const zpracovano = magistrat?.okrskyZpracovano ?? 0
  const celkem = magistrat?.okrskyCelkem ?? 0
  return {
    zpracovano,
    celkem,
    procenta: celkem > 0 ? Math.round((zpracovano / celkem) * 1000) / 10 : 0,
  }
}
