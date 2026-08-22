/**
 * Deterministické slugy. Používá se na názvy MČ, subjektů i jména kandidátů —
 * musí být stabilní mezi běhy importu, jinak se rozbijí URL už publikovaných profilů.
 */
/** Odstraní diakritiku, aby „reporyje" našlo Řeporyje. */
export function bezDiakritiky(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function slugify(text: string): string {
  return bezDiakritiky(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** „Praha hl.m." → `magistrat`, „Praha-Běchovice" → `praha-bechovice`, „Praha 7" → `praha-7`. */
export function slugZastupitelstva(nazev: string, kod: string): string {
  if (kod === KOD_MAGISTRAT) return 'magistrat'
  return slugify(nazev)
}

export const KOD_MAGISTRAT = '554782'

/**
 * Slug kandidáta: `prijmeni-jmeno`, při kolizi s číselným sufixem.
 * Kolize se řeší podle pořadí vstupu, proto musí být vstup vždy stejně seřazený.
 */
export function slugKandidata(
  prijmeni: string,
  jmeno: string,
  obsazene: Set<string>,
): string {
  const zaklad = slugify(`${prijmeni}-${jmeno}`)
  if (!obsazene.has(zaklad)) {
    obsazene.add(zaklad)
    return zaklad
  }
  for (let i = 2; ; i++) {
    const kandidat = `${zaklad}-${i}`
    if (!obsazene.has(kandidat)) {
      obsazene.add(kandidat)
      return kandidat
    }
  }
}
