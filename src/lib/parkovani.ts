/**
 * Zóny placeného stání u volebních místností — čtení
 * `data/mistnosti/parkovani.json`, který generuje `pnpm import:parkovani`.
 *
 * Rozlišují se tři stavy: v okolí je zóna (`ZonaMistnosti`), v okolí žádná
 * není (`null`), a o místnosti nevíme nic (`undefined`, třeba když neznáme
 * její polohu). Web každý z nich říká jinak.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ParkovaniMistnosti, ZonaMistnosti } from './parkovaniTypy'

export { type ParkovaniMistnosti, type ZonaMistnosti } from './parkovaniTypy'

let cache: ParkovaniMistnosti | null | undefined

function data(): ParkovaniMistnosti | null {
  if (cache === undefined) {
    const cesta = join(process.cwd(), 'data/mistnosti/parkovani.json')
    cache = existsSync(cesta) ? (JSON.parse(readFileSync(cesta, 'utf8')) as ParkovaniMistnosti) : null
  }
  return cache
}

/** Do kolika metrů od místnosti se zóna počítá; pochází z generovaných dat. */
export function okoliParkovaniMetru(): number {
  return data()?.okoliMetru ?? 150
}

export function zdrojParkovani(): ParkovaniMistnosti['zdroj'] | undefined {
  return data()?.zdroj
}

export function zonaMistnosti(
  mestskaCast: string,
  adresa: string,
): ZonaMistnosti | null | undefined {
  const zaznam = data()?.mistnosti.find((m) => m.mestskaCast === mestskaCast && m.adresa === adresa)
  return zaznam ? zaznam.zona : undefined
}
