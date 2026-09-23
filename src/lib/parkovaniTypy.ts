/**
 * Zóna placeného stání v okolí volební místnosti. Vlastní soubor bez
 * závislostí, aby typ mohl použít i klientský vyhledávač na /kde-volim.
 *
 * Data generuje `pnpm import:parkovani` z otevřených dat hl. m. Prahy.
 * `zona: null` znamená, že v okolí místnosti žádná zóna placeného stání
 * není — ne že je kde zaparkovat. O volných místech data nic neříkají.
 */
export type ZonaMistnosti = {
  /** Vzdálenost k nejbližšímu úseku, zaokrouhleno na desítky metrů. 0 = místnost stojí v zóně. */
  metru: number
  /** Tarif doslova ze zdroje („Po-Pá 08:00-19:59 40Kč/hod"), jeden řádek na časové pásmo. */
  tarif: string[]
  /** RES (rezidentní), MIX (smíšená), VIS (návštěvnická) — podle zdroje. */
  kategorie?: string
}

export type ParkovaniMistnosti = {
  stazeno: string
  okoliMetru: number
  zdroj: { nazev: string; url: string; licence: string }
  mistnosti: { mestskaCast: string; adresa: string; zona: ZonaMistnosti | null }[]
}
