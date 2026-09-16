import { strany } from '#content'
import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'
import { sPoctem } from '@/lib/cestina'
import { MAGISTRAT } from '@/lib/obsah'

/**
 * Vlastní karta pro /praha.
 *
 * Počty se berou z obsahu a číselníku, ne z ručně psané věty — kdyby
 * některá kandidátka přibyla nebo odpadla, zůstalo by na kartě staré
 * číslo a nikdo by si toho nevšiml, protože obrázek si při korektuře
 * nikdo neprohlíží.
 */
export const alt =
  'Kdo kandiduje do Zastupitelstva hlavního města Prahy — lídři, vylosovaná čísla a hodnocení programů'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function Karta() {
  const pocet = strany.filter((s) => s.uroven === 'magistrat').length

  return nahledovyObrazek({
    nadpisek: 'Komunální a senátní volby · 9.–10. října 2026',
    titulek: 'Kdo kandiduje do zastupitelstva Prahy',
    podtitul: `${sPoctem(pocet, 'volební strana', 'volební strany', 'volebních stran')}, ${MAGISTRAT.mandaty} mandátů. Lídři, vylosovaná čísla a hodnocení programů.`,
  })
}
