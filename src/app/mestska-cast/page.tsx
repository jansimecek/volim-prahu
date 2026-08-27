import type { Metadata } from 'next'
import { SeznamMestskychCasti } from '@/components/SeznamMestskychCasti'
import { kandidatka } from '@/lib/kandidatky'
import { MESTSKE_CASTI } from '@/lib/obsah'

export const metadata: Metadata = {
  title: 'Městské části',
  description:
    'Všech 57 pražských městských částí s vlastním zastupitelstvem — počet mandátů, kandidující subjekty a místní témata.',
}

export default function StrankaSeznamu() {
  const pocetStran = Object.fromEntries(
    MESTSKE_CASTI.map((mc) => [mc.slug, kandidatka(mc.slug)?.strany.length ?? 0]),
  )
  const jedinaKandidatka = MESTSKE_CASTI.filter((mc) => pocetStran[mc.slug] === 1)

  return (
    <div className="space-y-8">
      <header className="max-w-prose">
        <p className="popisek-uredni">Druhá úroveň samosprávy</p>
        <h1 className="mt-2 text-4xl">Městské části</h1>
        <p className="mt-4">
          Praha má {MESTSKE_CASTI.length} městských částí a každá volí vlastní zastupitelstvo.
          Rozhoduje o školkách, údržbě veřejné zeleně, zakázkách na svém území nebo o bytech,
          které jí Praha svěřila — ne o metru, územním plánu, parkovacích zónách ani obecně
          závazných vyhláškách. Ty jsou na magistrátu.
        </p>
        {jedinaKandidatka.length > 0 && (
          <p className="mt-4 border-l-2 border-praha pl-5">
            V {jedinaKandidatka.length} z nich podala kandidátní listinu{' '}
            <strong>jediná volební strana</strong>, takže tam volič mezi stranami
            vybírat nemůže. V seznamu jsou označené.
          </p>
        )}
      </header>
      <SeznamMestskychCasti casti={MESTSKE_CASTI} pocetStran={pocetStran} />
    </div>
  )
}
