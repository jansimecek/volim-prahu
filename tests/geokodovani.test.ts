import { describe, expect, it } from 'vitest'
import { kandidatiAdresy, polohaAdresy, vzdalenostMetru } from '../src/lib/geokodovani'
import type { AdresyMestskeCasti } from '../src/lib/okrskyHledani'

const ADRESY: AdresyMestskeCasti = {
  mestskaCast: 'praha-9',
  kodMomc: '500216',
  stazeno: '2026-09-07',
  sloupce: ['cislo', 'okrsek', 'adm', 'lat', 'lon'],
  ulice: {
    Litvínovská: [
      ['500/1', 9029, 1, 50.12, 14.5],
      ['600/1', 9031, 2, 50.121, 14.501],
    ],
    Sokolovská: [['324/14', 9011, 3, 50.1099, 14.5049]],
    'Strossmayerovo náměstí': [['990/4', 7010, 4, 50.1, 14.43]],
  },
}

/**
 * Poloha místnosti se dohledává z volného textu oznámení. Špatná shoda by
 * na mapě ukázala cizí dům, proto se při nejednoznačnosti raději nevrací nic.
 */
describe('geokódování adresy místnosti', () => {
  it('rozloží text s názvem budovy na ulici a číslo', () => {
    expect(kandidatiAdresy('ZŠ Litvínovská 500/1')).toEqual([
      { ulice: 'ZŠ Litvínovská', cislo: '500/1' },
      { ulice: 'ZŠ Litvínovská', cislo: '1/500' },
      { ulice: 'ZŠ Litvínovská', cislo: '500' },
      { ulice: 'Litvínovská', cislo: '500/1' },
      { ulice: 'Litvínovská', cislo: '1/500' },
      { ulice: 'Litvínovská', cislo: '500' },
    ])
  })

  it('najde adresu i s obráceným pořadím čísel a rozepsanou zkratkou', () => {
    expect(polohaAdresy('Sokolovská 14/324', ADRESY)).toEqual({ lat: 50.1099, lon: 14.5049 })
    expect(polohaAdresy('Strossmayerovo nám. 990/4, Praha 7', ADRESY)).toEqual({ lat: 50.1, lon: 14.43 })
    expect(polohaAdresy('ZŠ Litvínovská 600/1', ADRESY)).toEqual({ lat: 50.121, lon: 14.501 })
    // Překlep v orientačním čísle zachrání jednoznačné číslo popisné.
    expect(polohaAdresy('ZŠ Litvínovská 500/9', ADRESY)).toEqual({ lat: 50.12, lon: 14.5 })
  })

  it('nejednoznačné orientační číslo nerozhoduje', () => {
    expect(polohaAdresy('ZŠ Litvínovská 1', ADRESY)).toBeUndefined()
    expect(polohaAdresy('Neznámá 5', ADRESY)).toBeUndefined()
    expect(polohaAdresy('Radnice bez čísla', ADRESY)).toBeUndefined()
  })

  it('počítá vzdálenost vzdušnou čarou', () => {
    // Asi 1 km severně: 0,009 stupně šířky.
    expect(vzdalenostMetru({ lat: 50.1, lon: 14.5 }, { lat: 50.109, lon: 14.5 })).toBeCloseTo(1001, -1)
  })
})
