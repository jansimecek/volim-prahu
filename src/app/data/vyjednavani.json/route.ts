import { KONECNE_VYSLEDKY } from '@/lib/konecneVysledky'
import { vetsina } from '@/lib/koalice'
import { lhutyUstavujichZasedani } from '@/lib/terminy'
import {
  dohodnutaSestava,
  jeSledovane,
  POPIS_STAVU,
  stavVyjednavani,
  subjektySMandaty,
  vyjednavaniZastupitelstva,
} from '@/lib/vyjednavani'
import { absolutni } from '@/lib/web'

/**
 * Stav povolebního vyjednávání ve všech 58 zastupitelstvech jako JSON.
 *
 * Stav je odvozený z doložených událostí, nikdy odhadovaný; u každé
 * události je typ doložení (dokument, usnesení, citace, parafráze) a zdroje.
 * Statické — mění se jen s nasazením, kdy přibude nová událost.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  const zastupitelstva = KONECNE_VYSLEDKY.zastupitelstva.map((z) => {
    const v = vyjednavaniZastupitelstva(z.slug)
    const stav = stavVyjednavani(v)
    const zdroje = new Map((v?.zdroje ?? []).map((x) => [x.id, x]))
    return {
      slug: z.slug,
      nazev: z.nazev,
      stranka: absolutni(z.slug === 'magistrat' ? '/koalice#magistrat' : `/mestska-cast/${z.slug}#vyjednavani`),
      sledovanoPodrobne: jeSledovane(z.slug),
      mandatu: z.mandatuCelkem,
      vetsina: vetsina(z.mandatuCelkem),
      strany: subjektySMandaty(z),
      stav,
      stavPopis: POPIS_STAVU[stav],
      dohodnutaSestava: dohodnutaSestava(v) ?? null,
      ustavujiciZasedani: v?.ustavujiciZasedani?.datum ?? null,
      vedeni: v?.vedeni ?? [],
      ocekavanaRada: v?.ocekavanaRada && v.vedeni.length === 0
        ? { ...v.ocekavanaRada, zdroj: zdroje.get(v.ocekavanaRada.zdroj) ?? null }
        : null,
      overeno: v?.overeno ?? null,
      udalosti: (v?.udalosti ?? [])
        .slice()
        .sort((a, b) => b.datum.localeCompare(a.datum))
        .map((u) => ({ ...u, zdroje: u.zdroje.map((id) => zdroje.get(id)).filter(Boolean) })),
    }
  })

  return Response.json(
    {
      popis:
        'Povolební vyjednávání o vedení hlavního města Prahy a městských částí po komunálních volbách 2026. Zapisuje se jen doložené; stav plyne z poslední doložené události (ohlášená dohoda bez podpisu, memorandum, koaliční smlouva, volba vedení), nikdy z odhadu. Gesce (oblasti, které radní řídí) jsou u zvoleného vedení jen tam, kde je zdroj jmenuje; ocekavanaRada je složení a gesce ohlášené před volbou.',
      stranka: absolutni('/koalice'),
      lhuty: lhutyUstavujichZasedani(),
      zastupitelstva,
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
