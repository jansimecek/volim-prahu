import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Stránka každé městské části tvrdí, jestli tam volič dostane senátní lístek.
 * Odpověď se odvozuje z toho, že část NENÍ v žádném z letošních obvodů — takže
 * překlep ve slugu by tiše vyrobil chybné „senátora tady nevolíte".
 */
const KOREN = join(__dirname, '..')

type Obvod = {
  cislo: number
  mestskeCasti: string[]
  mestskeCastiCastecne: { slug: string }[]
}

const senat = JSON.parse(readFileSync(join(KOREN, '.velite/senat.json'), 'utf8')) as Obvod[]
const ciselnik = JSON.parse(
  readFileSync(join(KOREN, 'data/ciselniky/zastupitelstva.json'), 'utf8'),
) as { zastupitelstva: { slug: string; jeMagistrat: boolean }[] }

const slugyMC = new Set(
  ciselnik.zastupitelstva.filter((z) => !z.jeMagistrat).map((z) => z.slug),
)

describe('senátní obvody proti číselníku ČSÚ', () => {
  it('každá uvedená městská část existuje v číselníku', () => {
    for (const obvod of senat) {
      for (const slug of obvod.mestskeCasti) {
        expect(slugyMC.has(slug), `obvod ${obvod.cislo}: neznámý slug "${slug}"`).toBe(true)
      }
      for (const cast of obvod.mestskeCastiCastecne) {
        expect(
          slugyMC.has(cast.slug),
          `obvod ${obvod.cislo}: neznámý slug "${cast.slug}"`,
        ).toBe(true)
      }
    }
  })

  it('žádná městská část nepatří do dvou letošních obvodů zároveň', () => {
    const videno = new Map<string, number>()
    for (const obvod of senat) {
      for (const slug of [
        ...obvod.mestskeCasti,
        ...obvod.mestskeCastiCastecne.map((c) => c.slug),
      ]) {
        expect(videno.has(slug), `"${slug}" je ve dvou obvodech`).toBe(false)
        videno.set(slug, obvod.cislo)
      }
    }
  })

  it('v roce 2026 se volí ve třech pražských obvodech', () => {
    expect(senat.map((o) => o.cislo).sort((a, b) => a - b)).toEqual([21, 24, 27])
  })
})

describe('kandidáti do Senátu', () => {
  it('všichni kandidáti patří do některého z letošních obvodů', async () => {
    const { readFileSync, existsSync } = await import('node:fs')
    const cesta = join(KOREN, 'data/senat/kandidati.json')
    if (!existsSync(cesta)) return
    const data = JSON.parse(readFileSync(cesta, 'utf8')) as {
      kandidati: { obvod: number; cislo: number; slug: string }[]
    }
    const letosni = new Set(senat.map((o) => o.cislo))
    for (const k of data.kandidati) {
      expect(letosni.has(k.obvod), `kandidát v obvodu ${k.obvod}, kde se letos nevolí`).toBe(true)
    }
  })

  it('čísla kandidátů jsou v každém obvodu jedinečná a souvislá', async () => {
    const { readFileSync, existsSync } = await import('node:fs')
    const cesta = join(KOREN, 'data/senat/kandidati.json')
    if (!existsSync(cesta)) return
    const data = JSON.parse(readFileSync(cesta, 'utf8')) as {
      kandidati: { obvod: number; cislo: number }[]
    }
    for (const obvod of senat.map((o) => o.cislo)) {
      const cisla = data.kandidati.filter((k) => k.obvod === obvod).map((k) => k.cislo).sort((a, b) => a - b)
      expect(new Set(cisla).size).toBe(cisla.length)
      expect(cisla).toEqual(Array.from({ length: cisla.length }, (_, i) => i + 1))
    }
  })
})
