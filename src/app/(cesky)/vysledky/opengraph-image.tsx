import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'

export const alt = 'Konečné výsledky komunálních voleb 2026 v Praze'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function ObrazekProSdileni() {
  return nahledovyObrazek({
    nadpisek: 'Po komunálních volbách 2026',
    titulek: 'Konečné výsledky voleb v Praze',
    podtitul: 'Mandáty a zvolení zastupitelé všech 58 pražských zastupitelstev.',
  })
}
