import { NextResponse } from 'next/server'
import { ZASTUPITELSTVA } from '@/lib/obsah'
import { ulozSnapshot } from '@/lib/snapshot'
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

  /*
   * Fail-closed. Kdyby chybějící CRON_SECRET znamenal otevřený endpoint,
   * mohl by ho kdokoli spouštět v kuse a přes nás tlouct do ČSÚ — a nic
   * by to neprozradilo, protože Vercel hlavičku posílá jen když secret je.
   */
  if (!tajemstvi) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ chyba: 'Endpoint není nastavený.' }, { status: 503 })
    }
  } else if (request.headers.get('authorization') !== `Bearer ${tajemstvi}`) {
    return NextResponse.json({ chyba: 'Nepovoleno.' }, { status: 401 })
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
    // Podrobnost jde do serverového logu, ven jen tolik, kolik stačí k diagnóze.
    console.error('[volebni-noc] stažení selhalo:', chyba)
    return NextResponse.json({ ulozeno: false, chyba: 'Stažení z ČSÚ selhalo.' }, { status: 503 })
  }
}
