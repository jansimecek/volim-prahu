import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Snapshot } from './vysledky'

/**
 * Úložiště snapshotů výsledků.
 *
 * Ve Vercelu Blob, lokálně soubor. Snapshot je jen mezipaměť dat ČSÚ — když
 * se ztratí, další běh cronu ho vyrobí znovu. Kritické je něco jiného:
 * stránka nikdy nesmí zůstat prázdná a nikdy nesmí ukázat stará data
 * bez uvedení, jak jsou stará.
 */

const NAZEV_BLOBU = 'vysledky/posledni.json'
const CESTA_LOKALNE = join(process.cwd(), 'data/snapshots/posledni.json')

function maBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function ulozSnapshot(snapshot: Snapshot): Promise<void> {
  const telo = JSON.stringify(snapshot)

  if (maBlob()) {
    const { put } = await import('@vercel/blob')
    await put(NAZEV_BLOBU, telo, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    })
    return
  }

  mkdirSync(join(CESTA_LOKALNE, '..'), { recursive: true })
  writeFileSync(CESTA_LOKALNE, telo + '\n')
}

export async function nactiSnapshot(): Promise<Snapshot | null> {
  if (maBlob()) {
    try {
      const { head } = await import('@vercel/blob')
      const info = await head(NAZEV_BLOBU)
      const odpoved = await fetch(info.url, { cache: 'no-store' })
      if (!odpoved.ok) return null
      return (await odpoved.json()) as Snapshot
    } catch {
      // Snapshot ještě neexistuje nebo je Blob nedostupný — stránka to zvládne.
      return null
    }
  }

  if (!existsSync(CESTA_LOKALNE)) return null
  try {
    return JSON.parse(readFileSync(CESTA_LOKALNE, 'utf8')) as Snapshot
  } catch {
    return null
  }
}

/** Jak je snapshot starý v minutách. Používá se k označení zastaralých dat. */
export function stariMinut(snapshot: Snapshot, ted: Date = new Date()): number {
  const stazeno = new Date(snapshot.stazeno).getTime()
  if (!Number.isFinite(stazeno)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.round((ted.getTime() - stazeno) / 60_000))
}

/** Nad tímhle stářím stránka viditelně upozorní, že data nejsou čerstvá. */
export const PRAH_ZASTARALOSTI_MINUT = 10
