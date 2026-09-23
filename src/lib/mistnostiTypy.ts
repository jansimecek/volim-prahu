/**
 * Typy volební místnosti bez závislosti na zkompilovaném obsahu, aby je mohl
 * použít i klientský vyhledávač na /kde-volim.
 */
import type { ZonaMistnosti } from './parkovaniTypy'
import type { ZastavkaMistnosti } from './zastavkyTypy'

export type TypZdrojeMistnosti = 'oznameni-2026' | 'drivejsi-volby' | 'ruian'

export type Mistnost = {
  nazev: string
  adresa: string
  okrsky: number[]
  bezbarierova?: boolean
  poznamka?: string
  /** WGS84. Z oznámení (ručně) nebo dohledaná z adresy v registru ČÚZK při buildu. */
  poloha?: { lat: number; lon: number }
  /** Nejbližší zastávka PID, doplněná při buildu z otevřených dat (`pnpm import:zastavky`). */
  zastavka?: ZastavkaMistnosti
  /**
   * Zóna placeného stání v okolí místnosti (`pnpm import:parkovani`).
   * `null` = v okolí žádná není, chybějící pole = nevíme (neznámá poloha).
   */
  zona?: ZonaMistnosti | null
  zdroj: { typ: TypZdrojeMistnosti; nazev: string; url?: string; overeno?: string }
}

export const POPIS_ZDROJE: Record<TypZdrojeMistnosti, string> = {
  'oznameni-2026': 'Podle dokumentu městské části k volbám 2026 — sídlo okrsku z úřední desky',
  'drivejsi-volby': 'Údaj z dřívějších voleb — do 24. 9. 2026 se může změnit',
  ruian: 'Poznámka městské části v registru RÚIAN — není to oznámení pro rok 2026',
}
