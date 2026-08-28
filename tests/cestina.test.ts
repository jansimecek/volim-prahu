import { describe, expect, it } from 'vitest'
import { datumCesky, sPoctem, sklonuj } from '../src/lib/cestina'

describe('skloňování po číslovce', () => {
  it('rozlišuje jednotné, málo a mnoho', () => {
    expect(sklonuj(1, 'slib', 'sliby', 'slibů')).toBe('slib')
    expect(sklonuj(2, 'slib', 'sliby', 'slibů')).toBe('sliby')
    expect(sklonuj(4, 'slib', 'sliby', 'slibů')).toBe('sliby')
    expect(sklonuj(5, 'slib', 'sliby', 'slibů')).toBe('slibů')
    expect(sklonuj(0, 'slib', 'sliby', 'slibů')).toBe('slibů')
    expect(sklonuj(24, 'slib', 'sliby', 'slibů')).toBe('slibů')
  })

  it('spojí číslo s tvarem a oddělí tisíce', () => {
    expect(sPoctem(1, 'kandidát', 'kandidáti', 'kandidátů')).toBe('1 kandidát')
    expect(sPoctem(3, 'kandidát', 'kandidáti', 'kandidátů')).toBe('3 kandidáti')
    expect(sPoctem(1060, 'kandidát', 'kandidáti', 'kandidátů')).toMatch(/^1\s?060 kandidátů$/)
  })
})

describe('formát data', () => {
  it('převede ISO na český tvar', () => {
    expect(datumCesky('2026-08-12T00:00:00.000Z')).toBe('12. srpna 2026')
  })

  it('nesmyslnou hodnotu vrátí beze změny místo Invalid Date', () => {
    expect(datumCesky('nesmysl')).toBe('nesmysl')
  })
})
