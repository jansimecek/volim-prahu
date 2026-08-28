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

export function celeJmenoSenat(k: KandidatSenat): string {
  return [k.titulPred, k.jmeno, k.prijmeni, k.titulZa].filter(Boolean).join(' ').trim()
}

/**
 * Obhajuje stávající senátor mandát? Odvozeno z kandidátní listiny, ne
 * z domněnky — porovnáváme příjmení a křestní jméno proti seznamu ČSÚ.
 */
export function obhajuje(cisloObvodu: number, jmenoSenatora: string): boolean | null {
  const kandidati = kandidatiObvodu(cisloObvodu)
  if (kandidati.length === 0) return null
  const hledane = jmenoSenatora.toLowerCase().split(/\s+/).filter(Boolean)
  return kandidati.some((k) => {
    const cele = `${k.jmeno} ${k.prijmeni}`.toLowerCase()
    return hledane.every((cast) => cele.includes(cast))
  })
}
