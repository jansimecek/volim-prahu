import { describe, expect, it } from 'vitest'
import { mapaPrahy } from '../src/lib/mapaPrahy'

describe('mapa městských částí', () => {
  const mapa = mapaPrahy()

  it('má obrys všech 57 částí', () => {
    expect(mapa.casti).toHaveLength(57)
    for (const c of mapa.casti) expect(c.d).toMatch(/^M[\d.]+ [\d.]+L.*Z$/)
  })

  it('popisek leží uvnitř mapy', () => {
    for (const c of mapa.casti) {
      expect(c.popisek[0]).toBeGreaterThan(0)
      expect(c.popisek[0]).toBeLessThan(mapa.sirka)
      expect(c.popisek[1]).toBeGreaterThan(0)
      expect(c.popisek[1]).toBeLessThan(mapa.vyska)
    }
  })

  it('zůstává lehká, ať titulní strana nezbobtná', () => {
    // Celá geometrie jde do HTML titulní strany; zjednodušení ji drží pod 80 kB.
    const znaku = mapa.casti.reduce((n, c) => n + c.d.length, 0)
    expect(znaku).toBeLessThan(80_000)
  })
})
