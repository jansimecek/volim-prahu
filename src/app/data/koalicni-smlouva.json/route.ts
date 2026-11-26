import { radaMagistratu } from '@/lib/rada'
import { jePodmineny, jeProverovaci, maCislo, maLetopocet, mereniSmlouvy, smlouva, vsechnyZavazky } from '@/lib/smlouva'
import { absolutni } from '@/lib/web'

/**
 * Koaliční smlouva hl. m. Prahy 2026–2030 a rada jako JSON — pro každého,
 * kdo chce plnění sledovat vlastními nástroji. Znění závazků je doslovné,
 * strojové příznaky jsou označené jako strojové.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  return Response.json(
    {
      popis:
        'Programové priority koaliční smlouvy STAN, SPOLU a Prahy sobě pro hl. m. Prahu 2026–2030, doslovně po odrážkách. Radní u oddílu je přiřazení redakce podle gescí z 19. 11. 2026. Příznaky ve `strojove` vznikly vyhledáním v textu, nejsou to hodnocení. Závazek bez `analyza` zatím nikdo neposoudil.',
      stranka: absolutni('/koalicni-smlouva'),
      dokument: smlouva.dokument,
      overeno: smlouva.overeno,
      mereni: mereniSmlouvy(),
      rada: radaMagistratu().map((c) => ({
        jmeno: c.jmeno,
        funkce: c.funkce,
        subjekt: c.subjekt,
        gesce: c.gesce,
        oddilySmlouvy: c.oddily.map((o) => o.oddil.id),
        stranka: absolutni(`/kandidat/${c.kandidat}`),
      })),
      zavazky: vsechnyZavazky().map(({ kapitola, oddil, ...z }) => ({
        ...z,
        kapitola: kapitola.nazev,
        oddil: oddil.nazev,
        radni: oddil.radni,
        odkaz: absolutni(`/koalicni-smlouva#${z.id}`),
        strojove: {
          sCislem: maCislo(z.zneni),
          sTerminem: maLetopocet(z.zneni),
          proverovaci: jeProverovaci(z.zneni),
          podmineny: jePodmineny(z.zneni),
        },
      })),
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
