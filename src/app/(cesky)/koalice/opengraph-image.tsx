import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'

export const alt = 'Vyjednávání o vedení Prahy a městských částí po volbách 2026'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function ObrazekProSdileni() {
  return nahledovyObrazek({
    nadpisek: 'Po komunálních volbách 2026',
    titulek: 'Kdo s kým jedná o vedení Prahy',
    podtitul: 'Doložené události, sestavy s většinou, magistrát i 57 městských částí.',
  })
}
