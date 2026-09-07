import { describe, expect, it } from 'vitest'
import { mistnostZPoznamky } from '../src/lib/mistnosti'
import {
  najdiAdresu,
  normalizujCislo,
  normalizujUlici,
  uliceMestskeCasti,
  type AdresyMestskeCasti,
} from '../src/lib/okrsky'

const ADRESY: AdresyMestskeCasti = {
  mestskaCast: 'praha-7',
  kodMomc: '500186',
  stazeno: '2026-09-07',
  sloupce: ['cislo', 'okrsek', 'adm', 'lat', 'lon'],
  ulice: {
    Partyzánská: [
      ['18/23', 7001, 22724991, 50.111559, 14.438529],
      ['1/7', 7001, 22724992, 50.1116, 14.4386],
    ],
    Dělnická: [
      ['1/12a', 7002, 22000000, 50.1, 14.4],
      ['12/1', 7003, 22000001, 50.1, 14.4],
    ],
    Holešovice: [['č.ev. 6', 7004, 22312633, 50.1, 14.4]],
  },
}

/**
 * Vyhledání okrsku je jediné místo, kde by chyba poslala voliče do špatné
 * místnosti. Proto se tu netoleruje ani „skoro" shoda: ulice musí sedět celá
 * a nejednoznačné číslo vrátí všechny možnosti, ne první z nich.
 */
describe('vyhledání adresy', () => {
  it('normalizuje ulici bez diakritiky a velikosti písmen', () => {
    expect(normalizujUlici('  PARTYZÁNSKÁ ')).toBe('partyzanska')
    expect(normalizujUlici('nám. Na Balabence')).toBe('nam na balabence')
  })

  it('normalizuje číslo domu', () => {
    expect(normalizujCislo('18 / 23')).toBe('18/23')
    expect(normalizujCislo('12 A')).toBe('12a')
    expect(normalizujCislo('č. ev. 6')).toBe('č.ev. 6')
    expect(normalizujCislo('ev. 6')).toBe('č.ev. 6')
  })

  it('najde adresu podle celého čísla', () => {
    const nalez = najdiAdresu(ADRESY, 'partyzanska', '18/23')
    expect(nalez).toHaveLength(1)
    expect(nalez[0]).toMatchObject({ ulice: 'Partyzánská', okrsek: 7001, adm: 22724991 })
  })

  it('najde adresu podle samotného orientačního nebo popisného čísla', () => {
    expect(najdiAdresu(ADRESY, 'Partyzánská', '23')[0]?.cislo).toBe('18/23')
    expect(najdiAdresu(ADRESY, 'Partyzánská', '18')[0]?.cislo).toBe('18/23')
    expect(najdiAdresu(ADRESY, 'Dělnická', '12a')[0]?.okrsek).toBe(7002)
  })

  it('nejednoznačné číslo vrátí obě možnosti', () => {
    // „Dělnická 1" je popisné číslo domu 1/12a i orientační číslo domu 12/1.
    const nalez = najdiAdresu(ADRESY, 'delnicka', '1')
    expect(nalez.map((n) => n.cislo).sort()).toEqual(['1/12a', '12/1'].sort())
  })

  it('písmeno u orientačního čísla nedomýšlí', () => {
    // Dům 12 a dům 12a mohou být dvě různé budovy — „12" nesmí vrátit 12a.
    expect(najdiAdresu(ADRESY, 'Dělnická', '12').map((n) => n.cislo)).toEqual(['12/1'])
  })

  it('evidenční číslo hledá pod částí obce', () => {
    expect(najdiAdresu(ADRESY, 'Holešovice', 'č.ev. 6')[0]?.okrsek).toBe(7004)
    expect(najdiAdresu(ADRESY, 'Holešovice', '6')).toHaveLength(0)
  })

  it('cizí ulici ani prázdný vstup nedoplňuje', () => {
    expect(najdiAdresu(ADRESY, 'Partyzán', '18/23')).toHaveLength(0)
    expect(najdiAdresu(ADRESY, '', '18/23')).toHaveLength(0)
    expect(najdiAdresu(ADRESY, 'Partyzánská', '')).toHaveLength(0)
  })

  it('seřadí ulice česky', () => {
    expect(uliceMestskeCasti(ADRESY)).toEqual(['Dělnická', 'Holešovice', 'Partyzánská'])
  })
})

describe('místnost z poznámky RÚIAN', () => {
  it('rozdělí název a adresu na poslední čárce', () => {
    expect(mistnostZPoznamky('Volební místnost: SOU služeb, Novovysočanská 501/5')).toEqual({
      nazev: 'SOU služeb',
      adresa: 'Novovysočanská 501/5',
    })
  })

  it('poznámku bez čárky vezme celou jako adresu', () => {
    expect(mistnostZPoznamky('Volební místnost: Ubytovna U Svobodárny 1110/12')).toEqual({
      nazev: 'Ubytovna U Svobodárny 1110/12',
      adresa: 'Ubytovna U Svobodárny 1110/12',
    })
  })

  it('jinou poznámku ignoruje', () => {
    expect(mistnostZPoznamky('Oprava VO čp 385/178')).toBeUndefined()
    expect(mistnostZPoznamky(undefined)).toBeUndefined()
  })
})
