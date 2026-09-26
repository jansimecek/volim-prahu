import { NextResponse } from 'next/server'
import { kandidatka } from '@/lib/kandidatky'
import { mistnostiPoOkrscich, type Mistnost } from '@/lib/mistnosti'
import { MESTSKE_CASTI, mestskaCastPodleSlugu } from '@/lib/obsah'
import { okoliParkovaniMetru } from '@/lib/parkovani'
import { adresyMestskeCasti } from '@/lib/okrsky'
import { senatniStavMestskeCasti } from '@/lib/senat'

/**
 * Co potřebuje titulní strana, když zná okrsek z polohy: název části,
 * místnosti po okrscích, senátní stav a kolik stran kandiduje. Bez adres —
 * ty má `/api/okrsky/<mč>` pro vyhledávač.
 */
export const dynamic = 'force-static'

export function generateStaticParams() {
  return MESTSKE_CASTI.map((mc) => ({ slug: mc.slug }))
}

export type InfoMestskeCasti = {
  mestskaCast: string
  nazev: string
  mandaty: number
  pocetStran: number
  mistnosti: Record<number, Mistnost>
  /** Poloměr, ve kterém se u místnosti hledala zóna placeného stání. */
  okoliParkovaniMetru: number
  senat:
    | { stav: 'voli'; cislo: number; nazev: string; slug: string }
    | { stav: 'castecne'; cislo: number; nazev: string; slug: string; popis: string }
    | { stav: 'nevoli' }
}

export async function GET(_zadost: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mc = mestskaCastPodleSlugu(slug)
  const adresy = adresyMestskeCasti(slug)
  if (!mc || !adresy) return NextResponse.json({ chyba: 'Neznámá městská část.' }, { status: 404 })

  const mistnosti = mistnostiPoOkrscich(slug, adresy)

  const senat = senatniStavMestskeCasti(slug)
  const listina = kandidatka(slug)
  const odpoved: InfoMestskeCasti = {
    mestskaCast: slug,
    nazev: mc.nazev,
    mandaty: mc.mandaty,
    pocetStran: listina?.strany.length ?? 0,
    mistnosti,
    okoliParkovaniMetru: okoliParkovaniMetru(),
    senat:
      senat.stav === 'nevoli'
        ? { stav: 'nevoli' }
        : senat.stav === 'voli'
          ? { stav: 'voli', cislo: senat.obvod.cislo, nazev: senat.obvod.nazev, slug: senat.obvod.slug }
          : { stav: 'castecne', cislo: senat.obvod.cislo, nazev: senat.obvod.nazev, slug: senat.obvod.slug, popis: senat.popis },
  }
  return NextResponse.json(odpoved, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}
