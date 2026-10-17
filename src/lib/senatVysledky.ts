import vysledkyJson from '#data/senat/vysledky.json'
import { celeJmenoSenat, kandidatiObvodu, type KandidatSenat } from './senatKandidati'

/**
 * Výsledky senátních voleb 2026 v pražských obvodech (`pnpm import:senat-vysledky`).
 * Jméno, tituly a strana se berou z kandidátní listiny; z výsledků jen čísla.
 */
type KandidatVysledek = { cislo: number; jmeno: string; navrhujici: string; hlasy: number; procenta: number }

export type Kolo = {
  generovano: string
  okrskyCelkem: number
  zapsaniVolici: number
  vydaneObalky: number
  ucastProcenta: number
  platneHlasy: number
  kandidati: KandidatVysledek[]
  postupuji: number[]
  zvolen: number | null
}

type ObvodVysledek = { cislo: number; nazev: string; kolo1: Kolo; kolo2: Kolo | null }

const DATA = vysledkyJson as { zdroj: string; obvody: ObvodVysledek[] }

export function vysledkyObvodu(cislo: number): ObvodVysledek | undefined {
  return DATA.obvody.find((o) => o.cislo === cislo)
}

export type RadekVysledku = KandidatVysledek & {
  kandidat: KandidatSenat | undefined
  celeJmeno: string
  postupuje: boolean
  zvolen: boolean
}

/** Výsledky kola doplněné o kandidáty z kandidátní listiny, od nejvíc hlasů. */
export function radkyKola(cisloObvodu: number, kolo: Kolo): RadekVysledku[] {
  const listina = kandidatiObvodu(cisloObvodu)
  return kolo.kandidati.map((v) => {
    const kandidat = listina.find((k) => k.cislo === v.cislo)
    return {
      ...v,
      kandidat,
      celeJmeno: kandidat ? celeJmenoSenat(kandidat) : v.jmeno,
      postupuje: kolo.postupuji.includes(v.cislo),
      zvolen: kolo.zvolen === v.cislo,
    }
  })
}

/** Výsledek druhého kola: zvolený senátor a jeho soupeř, nebo null, dokud kolo není sečtené. */
export function vysledekDruhehoKola(cisloObvodu: number) {
  const kolo = vysledkyObvodu(cisloObvodu)?.kolo2
  if (!kolo) return null
  const radky = radkyKola(cisloObvodu, kolo)
  const zvoleny = radky.find((r) => r.zvolen)
  const souper = radky.find((r) => !r.zvolen)
  if (!zvoleny || !souper) return null
  return { kolo, zvoleny, souper }
}
