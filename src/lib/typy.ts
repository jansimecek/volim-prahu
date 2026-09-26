import type { Cas, Historie, Kompetence, Rozpocet, Zaver } from './hodnoceni'

export type HodnoceniSlibu = {
  kompetence: Kompetence
  rozpocet: Rozpocet
  cas: Cas
  historie: Historie
  zaver: Zaver
  zduvodneni: string
  zdroje: string[]
  reakce_subjektu?: { text: string; datum: string; odkaz?: string }
}

export type Zastupitelstvo = {
  kod: string
  nazev: string
  slug: string
  jeMagistrat: boolean
  mandaty: number
  okrskyCelkem: number
  pocetObyvatel: number
  rozsahyOkrsku: { od: number; do: number }[]
}
