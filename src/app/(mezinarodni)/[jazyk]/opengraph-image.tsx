import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'
import { JAZYKY, jeJazyk } from '@/lib/jazyky'
import { preklad } from '@/preklady'

/**
 * Náhledová karta v jazyce stránky. Odkaz na anglickou verzi se sdílí
 * v cizineckých skupinách na sociálních sítích — karta s českým textem
 * by tam vypadala jako omyl a nikdo by na ni neklikl.
 */
export const alt = 'Volím Prahu — Prague elections 2026'
export const size = VELIKOST
export const contentType = TYP_OBSAHU

export function generateStaticParams() {
  return JAZYKY.map((jazyk) => ({ jazyk }))
}

export default async function ObrazekProSdileni({
  params,
}: {
  params: Promise<{ jazyk: string }>
}) {
  const { jazyk } = await params
  const t = preklad(jeJazyk(jazyk) ? jazyk : 'en')

  return nahledovyObrazek({
    nadpisek: t.index.nadpisek,
    nazev: t.meta.nazevWebu,
    podtitul: t.index.h1,
  })
}
