/**
 * Typy volební místnosti bez závislosti na zkompilovaném obsahu, aby je mohl
 * použít i klientský vyhledávač na /kde-volim.
 */
export type TypZdrojeMistnosti = 'oznameni-2026' | 'drivejsi-volby' | 'ruian'

export type Mistnost = {
  nazev: string
  adresa: string
  okrsky: number[]
  bezbarierova?: boolean
  poznamka?: string
  zdroj: { typ: TypZdrojeMistnosti; nazev: string; url?: string; overeno?: string }
}

export const POPIS_ZDROJE: Record<TypZdrojeMistnosti, string> = {
  'oznameni-2026': 'Podle oznámení o době a místě konání voleb 2026',
  'drivejsi-volby': 'Údaj z dřívějších voleb — do 24. 9. 2026 se může změnit',
  ruian: 'Poznámka městské části v registru RÚIAN — není to oznámení pro rok 2026',
}
