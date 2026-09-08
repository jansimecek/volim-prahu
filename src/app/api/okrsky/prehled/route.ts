import { NextResponse } from 'next/server'
import { prehledOkrsku } from '@/lib/okrsky'

/**
 * Středy všech 1 120 okrsků pro určení okrsku z polohy: klient si podle
 * nejbližších středů vybere městskou část, jejíž hranice pak stáhne.
 * Kompaktní pole, asi 50 kB.
 */
export const dynamic = 'force-static'

export type PrehledProPolohu = {
  sloupce: ['cislo', 'mestskaCast', 'lon', 'lat']
  okrsky: [number, string, number, number][]
}

export function GET() {
  const prehled = prehledOkrsku()
  const odpoved: PrehledProPolohu = {
    sloupce: ['cislo', 'mestskaCast', 'lon', 'lat'],
    okrsky: (prehled?.okrsky ?? []).map((o) => [o.cislo, o.mestskaCast, o.stred[0], o.stred[1]]),
  }
  return NextResponse.json(odpoved, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}
