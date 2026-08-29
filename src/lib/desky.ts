import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type PolozkaDesky = { nazev: string; url: string; vyveseno: string }

export type StavDesky = {
  slug: string
  nazev: string
  zdroj: 'otevrena-data' | 'jen-odkaz'
  stav: 'oznameni-nalezeno' | 'ceka-se' | 'bez-otevrenych-dat' | 'zdroj-nedostupny'
  urlDesky?: string
  /** Odpovídá adresa desky? Když ne, odkaz se čtenáři nenabízí. */
  deskaDostupna?: boolean
  oznameni?: PolozkaDesky
  dalsiVolebni: PolozkaDesky[]
  poznamka?: string
}

export type SouhrnDesek = { zkontrolovano: string; stavy: StavDesky[] }

/** Lhůta pro vyvěšení oznámení o době a místě konání voleb. */
export const LHUTA_OZNAMENI = new Date('2026-09-24T23:59:59+02:00')

let cache: SouhrnDesek | null | undefined

export function souhrnDesek(): SouhrnDesek | null {
  if (cache !== undefined) return cache
  const cesta = join(process.cwd(), 'data/uredni-desky/stav.json')
  cache = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as SouhrnDesek) : null
  return cache
}

export function stavMestskeCasti(slug: string): StavDesky | undefined {
  return souhrnDesek()?.stavy.find((s) => s.slug === slug)
}

/**
 * Adresa desky, na kterou se dá čtenáře poslat. Neověřenou pustíme (stará
 * data ještě příznak nemají), prokazatelně mrtvou ne — odkaz na 404 je
 * horší než přiznané „adresu nemáme".
 */
export function odkazNaDesku(stav: StavDesky | undefined): string | undefined {
  return stav?.deskaDostupna === false ? undefined : stav?.urlDesky
}
