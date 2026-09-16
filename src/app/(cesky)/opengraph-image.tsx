import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'

export const alt =
  'Volím Prahu — volební průvodce pro komunální a senátní volby 9.–10. října 2026'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function ObrazekProSdileni() {
  return nahledovyObrazek({
    nadpisek: 'Komunální a senátní volby · 9.–10. října 2026',
    titulek: 'Co vaši kandidáti slibují — a co z toho můžou splnit',
    podtitul: 'Nezávislý průvodce pražskými volbami. Bez doporučení, se zdrojem u každého tvrzení.',
  })
}
