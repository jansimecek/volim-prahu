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
    }
  })
}

/** Dvojice do druhého kola, v pořadí podle prvního kola. */
export function soubojDruhehoKola(cisloObvodu: number): RadekVysledku[] {
  const v = vysledkyObvodu(cisloObvodu)
  return v ? radkyKola(cisloObvodu, v.kolo1).filter((r) => r.postupuje) : []
}
