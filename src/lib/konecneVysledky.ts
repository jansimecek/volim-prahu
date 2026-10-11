import vysledkyJson from '#data/vysledky/kv2026.json'
import { kandidatka, type Kandidat } from './kandidatky'
import type { Snapshot, StranaVysledek, ZastupitelstvoVysledek, Zvoleny } from './vysledky'

/**
 * Konečné výsledky voleb 2026 uložené v repozitáři (`pnpm import:vysledky`).
 *
 * Po sečtení se nemění, takže na ně nepotřebujeme úložiště volební noci.
 * Import zapíše jen úplně sečtená data, kde sedí mandáty i počty zvolených.
 */
export const KONECNE_VYSLEDKY = vysledkyJson as Snapshot

export function vysledekZastupitelstva(slug: string): ZastupitelstvoVysledek | undefined {
  return KONECNE_VYSLEDKY.zastupitelstva.find((z) => z.slug === slug)
}

/** Strany se zastupiteli, seřazené podle mandátů a pak hlasů. */
export function stranySMandaty(z: ZastupitelstvoVysledek): StranaVysledek[] {
  return z.strany.filter((s) => s.mandaty > 0).sort((a, b) => b.mandaty - a.mandaty || b.hlasy - a.hlasy)
}

/**
 * Kandidát z kandidátky, který odpovídá zvolenému. Id kandidáta je
 * `kód zastupitelstva-číslo strany-pořadí na listině`; import ověřil, že
 * jména sedí u všech zvolených.
 */
export function kandidatZvoleneho(
  z: ZastupitelstvoVysledek,
  strana: StranaVysledek,
  zvoleny: Zvoleny,
): Kandidat | undefined {
  const id = `${z.kod}-${strana.cislo}-${zvoleny.poradi}`
  return kandidatka(z.slug)
    ?.strany.find((s) => s.cislo === strana.cislo)
    ?.kandidati.find((k) => k.id === id)
}

/** Slug strany na kandidátce podle čísla na hlasovacím lístku. */
export function slugStrany(z: ZastupitelstvoVysledek, strana: StranaVysledek): string | undefined {
  return kandidatka(z.slug)?.strany.find((s) => s.cislo === strana.cislo)?.slug
}
