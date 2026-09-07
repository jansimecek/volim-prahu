import { describe, expect, it } from 'vitest'
import { kandidatiAdresy, polohaAdresy, polohaAdresyVPraze, vzdalenostMetru } from '../src/lib/geokodovani'
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
    'U Roháčových kasáren': [['1381/19', 10064, 5, 50.07, 14.47]],
    'Pošepného náměstí': [
      ['2022/2', 11058, 6, 50.0312, 14.4817],
      ['2022/3', 11058, 7, 50.0315, 14.4814],
    ],
    'Květnového vítězství': [
      ['57/17', 11041, 8, 50.0339, 14.5051],
      ['2367/57', 11043, 9, 50.035, 14.5141],
    ],
  },
}

/**
 * Poloha místnosti se dohledává z volného textu oznámení. Špatná shoda by
 * na mapě ukázala cizí dům, proto se při nejednoznačnosti raději nevrací nic.
 */
describe('geokódování adresy místnosti', () => {
  it('zkusí i nerozepsanou podobu, když ji má tak registr', () => {
    const veronske: AdresyMestskeCasti = { ...ADRESY, ulice: { 'Veronské nám.': [['391/1', 15003, 12, 50.05, 14.56]] } }
    expect(polohaAdresy('Veronské nám. 391, Praha 10 - Horní Měcholupy', veronske)).toEqual({ lat: 50.05, lon: 14.56 })
  })

  it('rozloží text s názvem budovy na ulici a číslo', () => {
    expect(kandidatiAdresy('ZŠ Litvínovská 500/1')).toEqual([
      { ulice: 'ZŠ Litvínovská', cislo: '500/1' },
      { ulice: 'ZŠ Litvínovská', cislo: '1/500' },
      { ulice: 'ZŠ Litvínovská', cislo: '500', jenPopisne: true },
      { ulice: 'Litvínovská', cislo: '500/1' },
      { ulice: 'Litvínovská', cislo: '1/500' },
      { ulice: 'Litvínovská', cislo: '500', jenPopisne: true },
    ])
  })

  it('najde adresu i s obráceným pořadím čísel a rozepsanou zkratkou', () => {
    expect(polohaAdresy('Sokolovská 14/324', ADRESY)).toEqual({ lat: 50.1099, lon: 14.5049 })
    expect(polohaAdresy('Strossmayerovo nám. 990/4, Praha 7', ADRESY)).toEqual({ lat: 50.1, lon: 14.43 })
    expect(polohaAdresy('ZŠ Litvínovská 600/1', ADRESY)).toEqual({ lat: 50.121, lon: 14.501 })
    // Překlep v orientačním čísle zachrání jednoznačné číslo popisné.
    expect(polohaAdresy('ZŠ Litvínovská 500/9', ADRESY)).toEqual({ lat: 50.12, lon: 14.5 })
  })

  it('rozepíše zkrácený název ulice, když je shoda jediná', () => {
    expect(polohaAdresy('U Roháč. kasáren 1381/19, Praha 10', ADRESY)).toEqual({ lat: 50.07, lon: 14.47 })
  })

  it('jeden dům s více vchody bere za jednu adresu', () => {
    expect(polohaAdresy('ZŠ Pošepného nám. 2022', ADRESY)).toEqual({ lat: 50.0312, lon: 14.4817 })
  })

  it('číslo, které je v ulici popisné i orientační, rozhodne okrsek místnosti', () => {
    expect(polohaAdresy('Květnového vítězství 57', ADRESY)).toBeUndefined()
    expect(polohaAdresy('Květnového vítězství 57', ADRESY, [11043, 11044])).toEqual({ lat: 50.035, lon: 14.5141 })
    expect(polohaAdresy('Květnového vítězství 57', ADRESY, [11041, 11043])).toBeUndefined()
  })

  it('vynechá „č.p." před číslem a rozepíše „bří"', () => {
    expect(kandidatiAdresy('Vachkova č.p. 630')[0]).toEqual({ ulice: 'Vachkova', cislo: '630', jenPopisne: true })
    expect(kandidatiAdresy('nám. bří Jandusů č.p. 2')[0]).toEqual({
      ulice: 'náměstí bratří Jandusů',
      cislo: '2',
      jenPopisne: true,
    })
  })

  it('výslovné „č.p." vyloučí shodu na orientační číslo', () => {
    const uvaly: AdresyMestskeCasti = {
      ...ADRESY,
      ulice: { 'náměstí Bratří Jandusů': [['2/38', 22001, 20, 50.03, 14.6], ['21/2', 22003, 21, 50.031, 14.601]] },
    }
    expect(polohaAdresy('nám. bří Jandusů 2', uvaly)).toBeUndefined()
    expect(polohaAdresy('nám. bří Jandusů č.p. 2', uvaly)).toEqual({ lat: 50.03, lon: 14.6 })
  })

  it('srazí mezeru před písmenem orientačního čísla', () => {
    expect(kandidatiAdresy('Kudrnova 235/1 a, Praha 5')[0]).toEqual({ ulice: 'Kudrnova', cislo: '235/1a' })
  })

  it('zvládne orientační číslo s písmenem před lomítkem', () => {
    expect(kandidatiAdresy('Svídnická 1a/599, Praha 8 - Troja')[0]).toEqual({ ulice: 'Svídnická', cislo: '1a/599' })
    expect(kandidatiAdresy('Svídnická 1a/599, Praha 8 - Troja')[1]).toEqual({ ulice: 'Svídnická', cislo: '599/1a' })
  })

  it('školu za hranicí části najde v jiné části, jen když je shoda jediná', () => {
    const praha4: AdresyMestskeCasti = { ...ADRESY, mestskaCast: 'praha-4', ulice: { Křesomyslova: [['724/2', 4002, 10, 50.0645, 14.434]] } }
    const praha5: AdresyMestskeCasti = { ...ADRESY, mestskaCast: 'praha-5', ulice: { Křesomyslova: [['724/9', 5001, 11, 50.07, 14.4]] } }
    expect(polohaAdresyVPraze('ZŠ Křesomyslova 724', ADRESY, [praha4])).toEqual({ lat: 50.0645, lon: 14.434 })
    expect(polohaAdresyVPraze('ZŠ Křesomyslova 724', ADRESY, [praha4, praha5])).toBeUndefined()
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
