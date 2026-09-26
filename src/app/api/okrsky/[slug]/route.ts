import { NextResponse } from 'next/server'
import { odkazNaDesku, stavMestskeCasti } from '@/lib/desky'
import { mistnostiPoOkrscich, type Mistnost } from '@/lib/mistnosti'
import { MESTSKE_CASTI, mestskaCastPodleSlugu } from '@/lib/obsah'
import { okoliParkovaniMetru } from '@/lib/parkovani'
import { adresyMestskeCasti, type AdresyMestskeCasti } from '@/lib/okrsky'

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
  /** Poloměr, ve kterém se u místnosti hledala zóna placeného stání. */
  okoliParkovaniMetru: number
  urlDesky?: string
}

export async function GET(_zadost: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mc = mestskaCastPodleSlugu(slug)
  const adresy = adresyMestskeCasti(slug)
  if (!mc || !adresy) return NextResponse.json({ chyba: 'Neznámá městská část.' }, { status: 404 })

  const mistnosti = mistnostiPoOkrscich(slug, adresy)

  const urlDesky = odkazNaDesku(stavMestskeCasti(slug))
  const odpoved: OdpovedOkrsku = {
    mestskaCast: slug,
    nazev: mc.nazev,
    stazeno: adresy.stazeno,
    ulice: adresy.ulice,
    mistnosti,
    okoliParkovaniMetru: okoliParkovaniMetru(),
    ...(urlDesky ? { urlDesky } : {}),
  }
  return NextResponse.json(odpoved, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}
