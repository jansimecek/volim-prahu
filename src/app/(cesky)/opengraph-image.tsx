import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'

export const alt = 'Volím Prahu — kdo povede Prahu po komunálních volbách 2026'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function ObrazekProSdileni() {
  return nahledovyObrazek({
    nadpisek: 'Po komunálních volbách 2026',
    titulek: 'Kdo povede Prahu a vaši městskou část',
    podtitul: 'Výsledky, vyjednávání o koalicích a zvolená vedení. Bez předpovědí, se zdrojem u každé zprávy.',
  })
}
