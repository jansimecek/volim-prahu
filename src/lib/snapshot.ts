import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Snapshot } from './vysledky'

export { PRAH_ZASTARALOSTI_MINUT, stariMinut } from './cerstvost'

/**
 * Úložiště snapshotů výsledků.
 *
 * Ve Vercelu Blob, lokálně soubor. Snapshot je jen mezipaměť dat ČSÚ — když
 * se ztratí, další běh cronu ho vyrobí znovu. Kritické je něco jiného:
 * stránka nikdy nesmí zůstat prázdná a nikdy nesmí ukázat stará data
 * bez uvedení, jak jsou stará.
 */

/**
 * Cíl snapshotu. Nácvik smí psát jedině do `nacvik`, aby nemohl výsledky
 * roku 2022 vydat za průběžný stav voleb 2026.
 */
export type Cil = 'ostry' | 'nacvik'

const NAZVY: Record<Cil, string> = {
  ostry: 'vysledky/posledni.json',
  nacvik: 'vysledky/nacvik.json',
}
const SOUBORY: Record<Cil, string> = {
  ostry: join(process.cwd(), 'data/snapshots/posledni.json'),
  nacvik: join(process.cwd(), 'data/snapshots/nacvik.json'),
}

function maBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function ulozSnapshot(snapshot: Snapshot, cil: Cil = 'ostry'): Promise<void> {
  const telo = JSON.stringify(snapshot)

  if (maBlob()) {
    const { put } = await import('@vercel/blob')
    await put(NAZVY[cil], telo, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    })
    return
  }

  mkdirSync(join(SOUBORY[cil], '..'), { recursive: true })
  writeFileSync(SOUBORY[cil], telo + '\n')
}

/** Levný strážce tvaru — poškozený snapshot nesmí shodit celou routu. */
function jeSnapshot(data: unknown): data is Snapshot {
  if (!data || typeof data !== 'object') return false
  const s = data as Partial<Snapshot>
  return Array.isArray(s.zastupitelstva) && s.zastupitelstva.length > 0 && typeof s.stazeno === 'string'
}

/**
 * Vrací null JEN když snapshot ještě neexistuje. Výpadek úložiště naopak
 * vyhodí chybu — Next si pak podrží poslední úspěšně vyrenderovanou stránku
 * místo aby zacachoval hlášku „zatím nemáme data“ uprostřed sčítání.
 */
export async function nactiSnapshot(cil: Cil = 'ostry'): Promise<Snapshot | null> {
  if (maBlob()) {
    const { head } = await import('@vercel/blob')
    let url: string
    try {
      url = (await head(NAZVY[cil])).url
    } catch (chyba) {
      // Blob ještě nevznikl — legitimní stav před prvním během cronu.
      if (chyba instanceof Error && /not found|404/i.test(chyba.message)) return null
      throw chyba
    }
    const odpoved = await fetch(url, { cache: 'no-store' })
    if (!odpoved.ok) throw new Error(`Snapshot se nepodařilo načíst: HTTP ${odpoved.status}`)
    const data: unknown = await odpoved.json()
    if (!jeSnapshot(data)) throw new Error('Uložený snapshot má neplatný tvar.')
    return data
  }

  if (!existsSync(SOUBORY[cil])) return null
  const data: unknown = JSON.parse(readFileSync(SOUBORY[cil], 'utf8'))
  if (!jeSnapshot(data)) throw new Error('Uložený snapshot má neplatný tvar.')
  return data
}

