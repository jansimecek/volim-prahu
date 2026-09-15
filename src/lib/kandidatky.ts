import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export type Kandidat = {
  id: string
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
  poradi: number
  zastupitelstvo: string
  /**
   * ČSÚ vede kandidaturu v registru jako neplatnou (PLATNOST=N). Zapisuje se
   * jen u takových kandidátů, aby diff dat nešuměl u tisíců platných.
   */
  neplatny?: true
}

export type StranaNaKandidatce = {
  /** Vylosované číslo na hlasovacím lístku, nebo null, pokud se ještě nelosovalo. */
  cislo: number | null
  vylosovano: boolean
  poradiVDatech: number
  kodStrany: string
  nazev: string
  zkratka: string
  slug: string
  slozeni: string[]
  kandidati: Kandidat[]
  /** Pořadí, která registrační úřad po škrtnutí kandidáta nechal volná. */
  skrtnutePozice?: number[]
}

/**
 * ČSÚ nechává škrtnutého kandidáta v datech jako řádek s textem místo jména
 * („Kandidát v registraci škrtnut" / „Registrační úřad ponechal pozici
 * volnou"). Bez rozpoznání by se ta věta zobrazila jako jméno lídra.
 */
export function jeSkrtnutyKandidat(prijmeni: string, jmeno: string): boolean {
  const text = `${prijmeni} ${jmeno}`.toLowerCase()
  return text.includes('škrtnut') || text.includes('ponechal pozici volnou')
}

/**
 * Vysvětlení neplatné kandidatury. Jedno znění pro kandidátní listinu i profil
 * kandidáta, ať neříkají každé něco jiného.
 *
 * Registr uvádí jen stav („neplatný, odvolaný“), ne důvod. Podle přehledu
 * lhůt ministerstva vnitra se do něj promítá vzdání se kandidatury i odvolání
 * kandidáta — který případ nastal, z dat nepoznáme, a proto ho nepíšeme.
 */
export const POPIS_NEPLATNE_KANDIDATURY =
  'Český statistický úřad ji v registru kandidátů vede jako neplatnou. Tak se do registru promítá vzdání se kandidatury nebo odvolání kandidáta volební stranou; který z důvodů nastal, registr neuvádí.'

export type Kandidatka = {
  zastupitelstvo: { kod: string; nazev: string; slug: string; mandaty: number }
  sada: string
  stazeno: string
  strany: StranaNaKandidatce[]
}

const cache = new Map<string, Kandidatka | null>()

export function kandidatka(slugZastupitelstva: string): Kandidatka | null {
  if (cache.has(slugZastupitelstva)) return cache.get(slugZastupitelstva) ?? null
  const cesta = join(process.cwd(), 'data/kandidatky', `${slugZastupitelstva}.json`)
  const data = existsSync(cesta)
    ? (JSON.parse(readFileSync(cesta, 'utf8')) as Kandidatka)
    : null
  cache.set(slugZastupitelstva, data)
  return data
}

export function stranaPodleKodu(
  slugZastupitelstva: string,
  kodStrany: string,
): StranaNaKandidatce | undefined {
  return kandidatka(slugZastupitelstva)?.strany.find((s) => s.kodStrany === kodStrany)
}

/** Kandidáti, jejichž kandidatura podle registru ČSÚ platí. */
export function platniKandidati(strana: StranaNaKandidatce | undefined): Kandidat[] {
  return strana?.kandidati.filter((k) => !k.neplatny) ?? []
}

/**
 * Jednička kandidátky. Autoritativní zdroj je ČSÚ, ne redakční text.
 * Kandidát s neplatnou kandidaturou kandidátku nevede, i kdyby byl na listině první.
 */
export function lidr(strana: StranaNaKandidatce | undefined): Kandidat | undefined {
  const platni = platniKandidati(strana)
  return platni.find((k) => k.poradi === 1) ?? platni[0]
}

export function celeJmeno(k: Kandidat): string {
  return [k.titulPred, k.jmeno, k.prijmeni, k.titulZa].filter(Boolean).join(' ').trim()
}

/** Kandidatury jedné osoby napříč všemi zastupitelstvy, kde se objevuje. */
export function kandidaturyOsoby(slugOsoby: string): {
  kandidat: Kandidat
  strana: StranaNaKandidatce
  zastupitelstvo: Kandidatka['zastupitelstvo']
}[] {
  const vysledek = []
  for (const slug of vsechnyKandidatky()) {
    const k = kandidatka(slug)
    if (!k) continue
    for (const strana of k.strany) {
      for (const kandidat of strana.kandidati) {
        if (kandidat.slug === slugOsoby) {
          vysledek.push({ kandidat, strana, zastupitelstvo: k.zastupitelstvo })
        }
      }
    }
  }
  return vysledek
}

let seznam: string[] | null = null
export function vsechnyKandidatky(): string[] {
  if (seznam) return seznam
  const adresar = join(process.cwd(), 'data/kandidatky')
  seznam = existsSync(adresar)
    ? readdirSync(adresar).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    : []
  return seznam
}
