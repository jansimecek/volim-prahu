import { NextResponse } from 'next/server'
import { odkazNaDesku, stavMestskeCasti } from '@/lib/desky'
import { mistnostiMestskeCasti, mistnostZPoznamky, type Mistnost } from '@/lib/mistnosti'
import { MESTSKE_CASTI, mestskaCastPodleSlugu } from '@/lib/obsah'
import { adresyMestskeCasti, okrskyMestskeCasti, type AdresyMestskeCasti } from '@/lib/okrsky'

/**
 * Adresy jedné městské části s okrsky, plus místnosti, které pro ni známe.
 * Generuje se při buildu — vyhledávač na /kde-volim si stáhne jen soubor
 * části, ve které hledaná ulice leží, ne celou Prahu.
 */
export const dynamic = 'force-static'

export function generateStaticParams() {
  return MESTSKE_CASTI.map((mc) => ({ slug: mc.slug }))
}

export type OdpovedOkrsku = {
  mestskaCast: string
  nazev: string
  stazeno: string
  ulice: AdresyMestskeCasti['ulice']
  /** Klíč je číslo okrsku. Chybí, když místnost neznáme z žádného zdroje. */
  mistnosti: Record<number, Mistnost>
  urlDesky?: string
}

export async function GET(_zadost: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mc = mestskaCastPodleSlugu(slug)
  const adresy = adresyMestskeCasti(slug)
  if (!mc || !adresy) return NextResponse.json({ chyba: 'Neznámá městská část.' }, { status: 404 })

  const mistnosti: Record<number, Mistnost> = {}
  for (const m of mistnostiMestskeCasti(slug)) for (const o of m.okrsky) mistnosti[o] = m
  for (const o of okrskyMestskeCasti(slug)) {
    const zRuian = mistnostZPoznamky(o.poznamka)
    if (!mistnosti[o.cislo] && zRuian) {
      mistnosti[o.cislo] = {
        ...zRuian,
        okrsky: [o.cislo],
        zdroj: { typ: 'ruian', nazev: 'RÚIAN, poznámka správce okrsku', overeno: o.platiOd },
      }
    }
  }

  const urlDesky = odkazNaDesku(stavMestskeCasti(slug))
  const odpoved: OdpovedOkrsku = {
    mestskaCast: slug,
    nazev: mc.nazev,
    stazeno: adresy.stazeno,
    ulice: adresy.ulice,
    mistnosti,
    ...(urlDesky ? { urlDesky } : {}),
  }
  return NextResponse.json(odpoved, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}
