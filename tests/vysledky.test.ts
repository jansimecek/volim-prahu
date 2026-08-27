import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { celkovyPostup, parsujVysledky, urlVysledku } from '../src/lib/vysledky'
import { PRAH_ZASTARALOSTI_MINUT, stariMinut } from '../src/lib/snapshot'

/**
 * Parser výsledků běží ve volební noci bez dozoru, takže má vlastní test
 * s uloženým vzorkem — nezávisle na tom, jestli je ČSÚ zrovna dostupné.
 */
const xml = readFileSync(join(__dirname, 'fixtures/vysledky-kv2022.xml'), 'utf8')
const slugy = new Map([
  ['554782', 'magistrat'],
  ['538531', 'praha-nedvezi'],
])

describe('parsování výsledků z ČSÚ', () => {
  const snapshot = parsujVysledky(xml, slugy, 'kv2022')

  it('načte všechna zastupitelstva ze vzorku', () => {
    expect(snapshot.zastupitelstva).toHaveLength(2)
    expect(snapshot.generovano).toBeTruthy()
  })

  it('přiřadí slug z číselníku, ne z názvu', () => {
    expect(snapshot.zastupitelstva.map((z) => z.slug).sort()).toEqual([
      'magistrat',
      'praha-nedvezi',
    ])
  })

  it('rozumí známým výsledkům magistrátu 2022', () => {
    const m = snapshot.zastupitelstva.find((z) => z.kod === '554782')!
    expect(m.mandatuCelkem).toBe(65)
    expect(m.okrskyCelkem).toBe(1123)
    expect(m.ucastProcenta).toBeCloseTo(43.91, 2)
    expect(m.spocteno).toBe(true)
    expect(m.strany[0]?.mandaty).toBe(19)
    expect(m.strany.reduce((n, s) => n + s.mandaty, 0)).toBe(65)
  })

  it('řadí strany sestupně podle procent', () => {
    const m = snapshot.zastupitelstva.find((z) => z.kod === '554782')!
    for (let i = 1; i < m.strany.length; i++) {
      expect(m.strany[i]!.procenta).toBeLessThanOrEqual(m.strany[i - 1]!.procenta)
    }
  })

  it('zvládne zastupitelstvo s jedinou volební stranou', () => {
    const n = snapshot.zastupitelstva.find((z) => z.kod === '538531')!
    expect(n.strany.length).toBeGreaterThanOrEqual(1)
    expect(n.strany.reduce((x, s) => x + s.mandaty, 0)).toBe(n.mandatuCelkem)
  })

  it('spočítá celkový postup sčítání', () => {
    expect(celkovyPostup(snapshot).procenta).toBe(100)
  })

  it('odmítne odpověď bez kořenového prvku', () => {
    expect(() => parsujVysledky('<NECO/>', slugy)).toThrow(/VYSLEDKY_OBCE_OKRES/)
  })

  it('odmítne odpověď bez zastupitelstev', () => {
    expect(() =>
      parsujVysledky(
        '<VYSLEDKY_OBCE_OKRES DATUM_CAS_GENEROVANI="2026-10-10T14:00:00"/>',
        slugy,
      ),
    ).toThrow(/žádné zastupitelstvo/)
  })
})

describe('adresa zdroje', () => {
  it('míří na sadu a datum voleb 2026', () => {
    expect(urlVysledku()).toContain('kv2026')
    expect(urlVysledku()).toContain('datumvoleb=20261009')
    expect(urlVysledku()).toContain('nuts=CZ0100')
  })
})

describe('stáří snapshotu', () => {
  const snapshot = parsujVysledky(xml, slugy, 'kv2022')

  it('čerstvý snapshot je pod prahem zastaralosti', () => {
    expect(stariMinut(snapshot)).toBeLessThan(PRAH_ZASTARALOSTI_MINUT)
  })

  it('starý snapshot překročí práh', () => {
    const stary = { ...snapshot, stazeno: new Date(Date.now() - 3_600_000).toISOString() }
    expect(stariMinut(stary)).toBeGreaterThan(PRAH_ZASTARALOSTI_MINUT)
  })

  it('nesmyslné datum nevrátí NaN, ale nekonečno', () => {
    expect(stariMinut({ ...snapshot, stazeno: 'nesmysl' })).toBe(Number.POSITIVE_INFINITY)
  })
})
