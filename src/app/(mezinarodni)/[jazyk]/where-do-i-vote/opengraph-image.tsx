import { TYP_OBSAHU, VELIKOST, nahledovyObrazek } from '@/components/NahledovyObrazek'
import { parametryKarty, textyKarty } from '@/lib/kartaSdileni'

export const size = VELIKOST
export const contentType = TYP_OBSAHU
export const generateStaticParams = parametryKarty

/**
 * `alt` musí být v jazyce stránky, a statický export by byl pro obě verze
 * stejný — proto `generateImageMetadata`, které dostane `params`.
 */
export function generateImageMetadata({ params }: { params: { jazyk: string } }) {
  return [
    {
      id: 'karta',
      alt: textyKarty(params.jazyk, 'where-do-i-vote').alt,
      size: VELIKOST,
      contentType: TYP_OBSAHU,
    },
  ]
}

export default async function Karta({ params }: { params: Promise<{ jazyk: string }> }) {
  const { jazyk } = await params
  return nahledovyObrazek(textyKarty(jazyk, 'where-do-i-vote'))
}
