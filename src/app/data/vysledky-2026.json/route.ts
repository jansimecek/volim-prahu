import { KONECNE_VYSLEDKY } from '@/lib/konecneVysledky'
import { absolutni } from '@/lib/web'

/**
 * Konečné výsledky voleb 2026 jako JSON — pro novináře, výzkumníky
 * a jazykové modely, které chtějí čísla, ne vykreslenou stránku.
 * Data jsou ČSÚ; my je jen přeskládáme a připojíme zvolené zastupitele.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  const telo = {
    popis:
      'Konečné výsledky voleb do Zastupitelstva hl. m. Prahy a 57 zastupitelstev městských částí, 9.–10. 10. 2026.',
    puvodDat: 'Český statistický úřad (prezentační aplikace volbyhned.cz), přeskládáno projektem Volím Prahu',
    stranka: absolutni('/vysledky'),
    poznamka:
      'Procenta jsou z platných hlasů. V komunálních volbách má volič tolik hlasů, kolik se volí zastupitelů, takže platneHlasy není počet voličů. Závazné jsou výsledky vyhlášené Státní volební komisí.',
    ...KONECNE_VYSLEDKY,
  }
  return Response.json(telo, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
