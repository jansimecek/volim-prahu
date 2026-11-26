/**
 * Slovník pro sledování koaliční smlouvy 2026–2030. Bez závislostí, aby ho
 * mohl načíst Velite (schéma) i klientská komponenta.
 *
 * Stav plnění je o tom, co se doložitelně stalo, ne o tom, jestli to byl
 * dobrý nápad. `bez-dokladu` není `nesplneno`: znamená, že výsledek jsme
 * nedohledali — zaměnit to by znamenalo obvinit konkrétní lidi z něčeho,
 * co jsme neprokázali (stejné pravidlo jako u plnění 2022–2026).
 */
export const STAV_PLNENI = [
  'nezahajeno',
  'v-priprave',
  'probiha',
  'splneno',
  'castecne',
  'nesplneno',
  'bez-dokladu',
] as const

export type StavPlneni = (typeof STAV_PLNENI)[number]

export const POPIS_STAVU_PLNENI: Record<StavPlneni, string> = {
  nezahajeno: 'nezahájeno',
  'v-priprave': 'v přípravě',
  probiha: 'probíhá',
  splneno: 'splněno',
  castecne: 'částečně splněno',
  nesplneno: 'nesplněno',
  'bez-dokladu': 'bez dokladu',
}
