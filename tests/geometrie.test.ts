import { describe, expect, it } from 'vitest'
import { bodVGeometrii, bodVPrstenci, vzdalenostPriblizne, type Geometrie } from '../src/lib/geometrie'

const ctverec: Geometrie = {
  type: 'Polygon',
  coordinates: [
    [
      [14.4, 50.1],
      [14.5, 50.1],
      [14.5, 50.2],
      [14.4, 50.2],
      [14.4, 50.1],
    ],
  ],
}

/**
 * Z polohy se určuje okrsek, tedy kam má člověk jít volit. Díra v polygonu
 * (budova vyňatá do jiného okrsku) nebo druhá část nesouvislého okrsku se
 * v Praze skutečně vyskytují — RÚIAN má 23 víceúčelových a 11 děr.
 */
describe('bod v polygonu', () => {
  it('rozliší uvnitř a vně', () => {
    expect(bodVPrstenci([14.45, 50.15], ctverec.coordinates[0]!)).toBe(true)
    expect(bodVPrstenci([14.55, 50.15], ctverec.coordinates[0]!)).toBe(false)
  })

  it('respektuje díru', () => {
    const sDirou: Geometrie = {
      type: 'Polygon',
      coordinates: [
        ctverec.coordinates[0]!,
        [
          [14.44, 50.14],
          [14.46, 50.14],
          [14.46, 50.16],
          [14.44, 50.16],
          [14.44, 50.14],
        ],
      ],
    }
    expect(bodVGeometrii([14.45, 50.15], sDirou)).toBe(false)
    expect(bodVGeometrii([14.41, 50.11], sDirou)).toBe(true)
  })

  it('zvládne nesouvislý okrsek', () => {
    const dvojity: Geometrie = {
      type: 'MultiPolygon',
      coordinates: [
        ctverec.coordinates,
        [
          [
            [14.6, 50.1],
            [14.7, 50.1],
            [14.7, 50.2],
            [14.6, 50.2],
            [14.6, 50.1],
          ],
        ],
      ],
    }
    expect(bodVGeometrii([14.65, 50.15], dvojity)).toBe(true)
    expect(bodVGeometrii([14.55, 50.15], dvojity)).toBe(false)
  })

  it('počítá přibližnou vzdálenost', () => {
    expect(vzdalenostPriblizne([14.4, 50.1], [14.4, 50.109])).toBeCloseTo(1002, -1)
  })
})
