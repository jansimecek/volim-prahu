import { describe, expect, it } from 'vitest'
import { sjtskNaWgs84, zaokrouhli } from '../src/lib/krovak'

/**
 * Referenční body vrátil geometrický server ČÚZK
 * (ags.cuzk.cz/arcgis/rest/services/Utilities/Geometry/GeometryServer/project,
 * inSR=5514, outSR=4326, transformation=1623) 7. 9. 2026 a shodují se
 * s polohou, kterou pro totéž adresní místo vrací prohlížecí služba nad RÚIAN.
 * První dva body jsou adresní místa v Holešovicích (U elektrárny 9/10,
 * Partyzánská 18/23), třetí definiční bod okrsku 56008 na Zbraslavi.
 *
 * Tolerance 2e-6 stupně je asi dvacet centimetrů.
 */
const REFERENCE: { x: number; y: number; lat: number; lon: number }[] = [
  { x: -741272.24, y: -1040840.65, lat: 50.108696743525343, lon: 14.438407556811134 },
  { x: -741220.33, y: -1040526.47, lat: 50.111558805942977, lon: 14.438528745113867 },
  { x: -747600.39, y: -1057218.69, lat: 49.955050373808504, lon: 14.382102214730118 },
]

describe('S-JTSK → WGS84', () => {
  it.each(REFERENCE)('sedí na referenční bod ($lat, $lon)', ({ x, y, lat, lon }) => {
    const bod = sjtskNaWgs84(x, y)
    expect(Math.abs(bod.lat - lat)).toBeLessThan(2e-6)
    expect(Math.abs(bod.lon - lon)).toBeLessThan(2e-6)
  })

  it('zaokrouhluje na šest míst', () => {
    expect(zaokrouhli(50.1087723262)).toBe(50.108772)
  })
})
