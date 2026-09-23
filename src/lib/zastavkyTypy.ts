/**
 * Nejbližší zastávka PID k volební místnosti. Vlastní soubor bez závislostí,
 * aby typ mohl použít i klientský vyhledávač na /kde-volim.
 *
 * Data generuje `pnpm import:zastavky` do `data/mistnosti/zastavky.json`.
 * Vzdálenost je vzdušnou čarou, ne délka pěší trasy — web to u ní píše.
 */
export type ZastavkaMistnosti = {
  nazev: string
  /** Vzdušnou čarou, zaokrouhleno na desítky metrů. */
  metru: number
  linky: { nazev: string; typ: string }[]
  /** Aspoň jedno nástupiště má v datech PID bezbariérový přístup. */
  bezbarierovaZastavka?: true
}

export type ZastavkyMistnosti = {
  stazeno: string
  zdroj: { nazev: string; url: string; generovano: string }
  mistnosti: { mestskaCast: string; adresa: string; zastavka: ZastavkaMistnosti }[]
}
