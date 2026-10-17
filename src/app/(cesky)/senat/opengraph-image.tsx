import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'

export const alt = 'Zvolení senátoři za Prahu 2026: Padevět, Láska, Smoljak'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function ObrazekProSdileni() {
  return nahledovyObrazek({
    nadpisek: 'Senát · druhé kolo 16.–17. října 2026',
    titulek: 'Zvolení senátoři za Prahu',
    podtitul: 'Praha 1 Jiří Padevět, Praha 5 Václav Láska, Praha 9 David Smoljak. Výsledky obou kol.',
  })
}
