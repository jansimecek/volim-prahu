import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type KandidatSenat = {
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
  volebniStrana: string
}

type Data = { sada: string; stazeno: string; kandidati: KandidatSenat[] }

let cache: Data | null | undefined

function nactiData(): Data | null {
  if (cache !== undefined) return cache
  const cesta = join(process.cwd(), 'data/senat/kandidati.json')
  cache = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as Data) : null
  return cache
}

export function kandidatiObvodu(cislo: number): KandidatSenat[] {
  return (nactiData()?.kandidati ?? [])
    .filter((k) => k.obvod === cislo)
    .sort((a, b) => a.cislo - b.cislo)
}

export function sadaSenat(): string | null {
  return nactiData()?.sada ?? null
}

/**
 * Název navrhující strany pro zobrazení. Některé strany si jako název
 * zaregistrovaly celý volební slogan; ČSÚ takový název ořízne na 200 znaků
 * a v tabulce by končil uprostřed slova. Nad 120 znaků proto bereme jen
 * část před první pomlčkou, kde název strany končí a začíná slogan.
 */
export function nazevStranySenat(nazev: string): string {
  if (nazev.length <= 120) return nazev
  const pred = nazev.split(/\s[-–]\s/)[0]!.trim()
  return pred.length >= 3 && pred.length < nazev.length ? pred : `${nazev.slice(0, 117).trimEnd()}…`
}

export function celeJmenoSenat(k: KandidatSenat): string {
  return [k.titulPred, k.jmeno, k.prijmeni, k.titulZa].filter(Boolean).join(' ').trim()
}
