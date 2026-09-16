import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'

/**
 * Vlastní karta pro /kde-volim.
 *
 * Bez ní se sdílel obecný obrázek celého webu, takže odkaz na vyhledávač
 * okrsku vypadal stejně jako odkaz na titulní stranu. Tahle stránka se
 * přitom sdílí nejčastěji ze všech — je to jediná odpověď na otázku
 * „kam mám v sobotu jít".
 *
 * Na kartě vede vyhledávač, ne omyl s voličským průkazem: kdo odkaz
 * posílá dál, posílá ho kvůli adrese místnosti. Průkaz je druhá věta.
 */
export const alt =
  'Kde a jak volím — vyhledávač volebního okrsku a místnosti podle adresy'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function Karta() {
  return nahledovyObrazek({
    nadpisek: 'Komunální a senátní volby · 9.–10. října 2026',
    titulek: 'Kde a jak volím?',
    podtitul:
      'Zadejte adresu a najdete okrsek i volební místnost. Voličský průkaz u komunálních voleb neexistuje.',
  })
}
