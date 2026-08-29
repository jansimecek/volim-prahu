/**
 * Identifikátory okruhů srovnání témat.
 *
 * Samostatný soubor kvůli velite.config.ts: schéma obsahu ho potřebuje pro
 * enum, ale nesmí kvůli tomu tahat celý src/lib/temata.ts, který importuje
 * zkompilovaný obsah — to by byl kruh (obsah by potřeboval sám sebe).
 */
export const ID_OKRUHU = [
  'bydleni',
  'doprava',
  'uzemni-plan',
  'rozpocet',
  'skolstvi',
  'prostredi',
  'socialni',
] as const

export type IdOkruhu = (typeof ID_OKRUHU)[number]
