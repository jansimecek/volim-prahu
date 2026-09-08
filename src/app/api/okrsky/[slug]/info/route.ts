import { NextResponse } from 'next/server'
import { polohaAdresyVPraze } from '@/lib/geokodovani'
import { kandidatka } from '@/lib/kandidatky'
import { mistnostiMestskeCasti, mistnostZPoznamky, type Mistnost } from '@/lib/mistnosti'
import { MESTSKE_CASTI, mestskaCastPodleSlugu } from '@/lib/obsah'
import { adresyMestskeCasti, okrskyMestskeCasti, type AdresyMestskeCasti } from '@/lib/okrsky'
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

  const ostatni = MESTSKE_CASTI.filter((m) => m.slug !== slug)
    .map((m) => adresyMestskeCasti(m.slug))
    .filter((a): a is AdresyMestskeCasti => a !== null)
  const sPolohou = (m: Mistnost): Mistnost => {
    const poloha = m.poloha ?? polohaAdresyVPraze(m.adresa, adresy, ostatni, m.okrsky)
    return poloha ? { ...m, poloha } : m
  }
  const mistnosti: Record<number, Mistnost> = {}
  for (const m of mistnostiMestskeCasti(slug).map(sPolohou)) for (const o of m.okrsky) mistnosti[o] = m
  for (const o of okrskyMestskeCasti(slug)) {
    const zRuian = mistnostZPoznamky(o.poznamka)
    if (!mistnosti[o.cislo] && zRuian) {
      mistnosti[o.cislo] = sPolohou({
        ...zRuian,
        okrsky: [o.cislo],
        zdroj: { typ: 'ruian', nazev: 'RÚIAN, poznámka správce okrsku', overeno: o.platiOd },
      })
    }
  }

  const senat = senatniStavMestskeCasti(slug)
  const listina = kandidatka(slug)
  const odpoved: InfoMestskeCasti = {
    mestskaCast: slug,
    nazev: mc.nazev,
    mandaty: mc.mandaty,
    pocetStran: listina?.strany.length ?? 0,
    mistnosti,
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
