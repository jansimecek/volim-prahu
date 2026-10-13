import { describe, expect, it } from 'vitest'
import { nazevStranySenat } from '../src/lib/senatKandidati'

describe('název navrhující strany u Senátu', () => {
  it('běžný název nechá celý', () => {
    expect(nazevStranySenat('Občanská demokratická strana')).toBe('Občanská demokratická strana')
  })

  it('název se sloganem oříznutý ČSÚ zkrátí po první pomlčce', () => {
    // Skutečný název z registru, který ČSÚ ořízl na 200 znaků uprostřed slova.
    const nazev =
      'ŠVÝCARSKÁ DEMOKRACIE - Švýcaři si užívají nejvyšší kvality života na světě - PRŮMĚRNOU MZDU mají v přepočtu zhruba 185 000 Kč (ČR 47 000 Kč), DPH mají pouhých 8 % (ČR 21 %), STÁTNÍ DLUH dlouhodobě sni'
    expect(nazevStranySenat(nazev)).toBe('ŠVÝCARSKÁ DEMOKRACIE')
  })

  it('dlouhý název bez pomlčky zkrátí s výpustkou, nikdy uprostřed bez znaménka', () => {
    const vysledek = nazevStranySenat('a'.repeat(150))
    expect(vysledek.endsWith('…')).toBe(true)
    expect(vysledek.length).toBeLessThanOrEqual(118)
  })
})
