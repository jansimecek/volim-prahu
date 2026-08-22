import type { Metadata } from 'next'
import { SeznamMestskychCasti } from '@/components/SeznamMestskychCasti'
import { MESTSKE_CASTI } from '@/lib/obsah'

export const metadata: Metadata = {
  title: 'Městské části',
  description:
    'Všech 57 pražských městských částí s vlastním zastupitelstvem — počet mandátů, kandidující subjekty a místní témata.',
}

export default function StrankaSeznamu() {
  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <p className="popisek-uredni">Druhá úroveň samosprávy</p>
        <h1 className="mt-2 text-4xl">Městské části</h1>
        <p className="mt-4">
          Praha má {MESTSKE_CASTI.length} městských částí a každá volí vlastní zastupitelstvo.
          Rozhoduje o školkách, místních parcích, parkovacích zónách nebo pronájmech svých
          budov — ne o metru, územním plánu nebo obecně závazných vyhláškách. Ty jsou na
          magistrátu.
        </p>
      </header>
      <SeznamMestskychCasti casti={MESTSKE_CASTI} />
    </div>
  )
}
