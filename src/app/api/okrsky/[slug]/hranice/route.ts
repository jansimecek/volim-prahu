import { NextResponse } from 'next/server'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { hraniceMestskeCasti } from '@/lib/okrsky'

/**
 * Hranice okrsků jedné městské části jako GeoJSON ve WGS84. Stahuje se až
 * pro mapu k nalezenému okrsku, ne se stránkou — u Prahy 6 má 150 kB.
 */
export const dynamic = 'force-static'

export function generateStaticParams() {
  return MESTSKE_CASTI.map((mc) => ({ slug: mc.slug }))
}

export async function GET(_zadost: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hranice = hraniceMestskeCasti(slug)
  if (!hranice) return NextResponse.json({ chyba: 'Neznámá městská část.' }, { status: 404 })
  return NextResponse.json(hranice, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}
