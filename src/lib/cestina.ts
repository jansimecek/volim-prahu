/**
 * České skloňování po číslovce. 1 → slib, 2–4 → sliby, 5+ → slibů.
 * Bez toho na stránce stojí „1 hodnocených slibů“, což čtenáře zdrží víc,
 * než by se zdálo.
 */
export function sklonuj(pocet: number, jeden: string, dva: string, pet: string): string {
  const n = Math.abs(pocet)
  if (n === 1) return jeden
  if (n >= 2 && n <= 4) return dva
  return pet
}

export function sPoctem(
  pocet: number,
  jeden: string,
  dva: string,
  pet: string,
): string {
  return `${new Intl.NumberFormat('cs-CZ').format(pocet)} ${sklonuj(pocet, jeden, dva, pet)}`
}

const denMesicRok = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long' })

/** Datum z frontmatteru přichází jako ISO řetězec, čtenář chce český tvar. */
export function datumCesky(hodnota: string): string {
  const datum = new Date(hodnota)
  return Number.isFinite(datum.getTime()) ? denMesicRok.format(datum) : hodnota
}
