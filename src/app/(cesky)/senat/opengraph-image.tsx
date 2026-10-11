import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'

export const alt = 'Druhé kolo senátních voleb v Praze 16.–17. října 2026'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export default function ObrazekProSdileni() {
  return nahledovyObrazek({
    nadpisek: 'Senát · pátek 16. a sobota 17. října 2026',
    titulek: 'Druhé kolo senátních voleb v Praze',
    podtitul: 'Praha 1, Praha 5 a Praha 9: kdo s kým, výsledky prvního kola a jak se volí.',
  })
}
