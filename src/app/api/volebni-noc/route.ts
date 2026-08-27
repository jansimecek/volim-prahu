import { NextResponse } from 'next/server'
import { ZASTUPITELSTVA } from '@/lib/obsah'
import { nactiSnapshot, ulozSnapshot } from '@/lib/snapshot'
import { stahniVysledky } from '@/lib/vysledky'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cíl Vercel Cronu ve volební noci. Stáhne výsledky z ČSÚ a uloží snapshot.
 *
 * Když stahování selže, NEPŘEPISUJEME poslední dobrý snapshot — stránka radši
 * ukáže starší data s viditelným časem než prázdno.
 */
export async function GET(request: Request) {
  const tajemstvi = process.env.CRON_SECRET
  if (tajemstvi) {
    const hlavicka = request.headers.get('authorization')
    if (hlavicka !== `Bearer ${tajemstvi}`) {
      return NextResponse.json({ chyba: 'Nepovoleno.' }, { status: 401 })
    }
  }

  const slugPodleKodu = new Map(ZASTUPITELSTVA.map((z) => [z.kod, z.slug]))

  try {
    const snapshot = await stahniVysledky(slugPodleKodu)
    await ulozSnapshot(snapshot)
    return NextResponse.json({
      ulozeno: true,
      generovano: snapshot.generovano,
      zastupitelstev: snapshot.zastupitelstva.length,
    })
  } catch (chyba) {
    const predchozi = await nactiSnapshot()
    return NextResponse.json(
      {
        ulozeno: false,
        chyba: chyba instanceof Error ? chyba.message : 'neznámá chyba',
        poslednUspesnyOdber: predchozi?.stazeno ?? null,
      },
      { status: 503 },
    )
  }
}
