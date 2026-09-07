import { NextResponse } from 'next/server'
import { MESTSKE_CASTI } from '@/lib/obsah'
import { indexUlic } from '@/lib/okrsky'

/** Generuje se při buildu z data/okrsky — index ulic pro našeptávač na /kde-volim. */
export const dynamic = 'force-static'

export function GET() {
  return NextResponse.json(
    { ulice: indexUlic(MESTSKE_CASTI.map((mc) => mc.slug)) },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
  )
}
