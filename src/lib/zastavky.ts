/**
 * Nejbližší zastávka PID k volební místnosti — čtení
 * `data/mistnosti/zastavky.json`, který generuje `pnpm import:zastavky`.
 *
 * Klíčem je městská část a adresa místnosti, protože jedna budova obsluhuje
 * i několik okrsků. Když místnost v datech není (neznámá poloha, nebo žádná
 * zastávka do kilometru), vrací se `undefined` a web o dopravě nic netvrdí.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ZastavkaMistnosti, ZastavkyMistnosti } from './zastavkyTypy'

export { type ZastavkaMistnosti, type ZastavkyMistnosti } from './zastavkyTypy'

let cache: ZastavkyMistnosti | null | undefined

function data(): ZastavkyMistnosti | null {
  if (cache === undefined) {
    const cesta = join(process.cwd(), 'data/mistnosti/zastavky.json')
    cache = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as ZastavkyMistnosti) : null
  }
  return cache
}

export function zdrojZastavek(): ZastavkyMistnosti['zdroj'] | undefined {
  return data()?.zdroj
}

export function zastavkaMistnosti(mestskaCast: string, adresa: string): ZastavkaMistnosti | undefined {
  return data()?.mistnosti.find((m) => m.mestskaCast === mestskaCast && m.adresa === adresa)?.zastavka
}
