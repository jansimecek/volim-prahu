import { NextResponse } from 'next/server'
import { ZASTUPITELSTVA } from '@/lib/obsah'
import { ulozSnapshot } from '@/lib/snapshot'
import { stahniVysledky, type Snapshot } from '@/lib/vysledky'
import { stahniVysledkyVolbyhned } from '@/lib/vysledkyVolbyhned'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cíl Vercel Cronu ve volební noci. Stáhne výsledky z ČSÚ a uloží snapshot.
 *
 * Když stahování selže, NEPŘEPISUJEME poslední dobrý snapshot — stránka radši
 * ukáže starší data s viditelným časem než prázdno.
 *
 * Primární zdroj je hromadné XML z volby.gov.cz. Když ČSÚ pod náporem vrací
 * stránku o nedostupnosti, sáhneme po JSONu z volbyhned.cz. XML má kratší
 * timeout, aby na zálohu zbyl čas do limitu funkce.
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

  let snapshot: Snapshot
  try {
    snapshot = await stahniVysledky(slugPodleKodu, undefined, undefined, 15_000)
  } catch (chybaXml) {
    console.warn('[volebni-noc] XML z volby.gov.cz selhalo, zkouším volbyhned.cz:', chybaXml)
    try {
      snapshot = await stahniVysledkyVolbyhned(slugPodleKodu)
    } catch (chyba) {
      // Podrobnost jde do serverového logu, ven jen tolik, kolik stačí k diagnóze.
      console.error('[volebni-noc] stažení selhalo z obou zdrojů:', chyba)
      return NextResponse.json({ ulozeno: false, chyba: 'Stažení z ČSÚ selhalo.' }, { status: 503 })
    }
  }

  await ulozSnapshot(snapshot)
  return NextResponse.json({
    ulozeno: true,
    zdroj: snapshot.zdroj,
    generovano: snapshot.generovano,
    zastupitelstev: snapshot.zastupitelstva.length,
  })
}
