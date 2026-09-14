import { describe, expect, it } from 'vitest'
import { minimalniKoalice, vetsina } from '../src/lib/koalice'

// Rozdělení mandátů, které podle § 45 vychází z volebního modelu Median ze září 2026.
// Pořadí na vstupu je abecední, stejně jako na webu.
const zari = [
  { id: 'ano', mandaty: 17 },
  { id: 'motoriste', mandaty: 3 },
  { id: 'pirati', mandaty: 7 },
  { id: 'praha-sobe', mandaty: 9 },
  { id: 'spd', mandaty: 3 },
  { id: 'spolu', mandaty: 10 },
  { id: 'stan', mandaty: 16 },
]
const sestavy = (k: { clenove: string[] }[]) => k.map((x) => x.clenove.join('+'))

describe('koalice z rozdělení mandátů', () => {
  it('většina v pětašedesátičlenném zastupitelstvu je 33', () => {
    expect(vetsina(65)).toBe(33)
    expect(vetsina(45)).toBe(23)
  })

  it('vypíše minimální vítězné sestavy a vynechá ty bez většiny', () => {
    const k = sestavy(minimalniKoalice(zari, 65))
    expect(k).toContain('ano+stan')
    expect(k).toContain('pirati+spolu+stan')
    expect(k).toContain('praha-sobe+spolu+stan')
    expect(k).not.toContain('pirati+praha-sobe+stan')
    expect(k).not.toContain('ano+spolu')
  })

  it('nevypíše sestavu, ze které jde někoho odebrat a většina zůstane', () => {
    const k = minimalniKoalice(zari, 65)
    const mandaty = new Map(zari.map((x) => [x.id, x.mandaty]))
    for (const s of k) {
      expect(s.mandaty).toBeGreaterThanOrEqual(33)
      for (const clen of s.clenove) expect(s.mandaty - mandaty.get(clen)!).toBeLessThan(33)
    }
    expect(sestavy(k)).not.toContain('ano+praha-sobe+stan')
  })

  it('řadí podle počtu členů a pak podle pořadí na vstupu, ne podle mandátů', () => {
    const k = minimalniKoalice(zari, 65)
    const delky = k.map((s) => s.clenove.length)
    expect(delky).toEqual([...delky].sort((a, b) => a - b))
    expect(k[0]?.clenove).toEqual(['ano', 'stan'])
  })

  it('subjekt s většinou sám je minimální sestava a nikdo bez něj ji nemá', () => {
    const k = minimalniKoalice([{ id: 'a', mandaty: 34 }, { id: 'b', mandaty: 20 }, { id: 'c', mandaty: 11 }], 65)
    expect(sestavy(k)).toEqual(['a'])
  })

  it('subjekty bez mandátu do sestav nezapočítá', () => {
    const k = minimalniKoalice([{ id: 'a', mandaty: 33 }, { id: 'nula', mandaty: 0 }, { id: 'b', mandaty: 32 }], 65)
    expect(sestavy(k)).toEqual(['a'])
  })

  it('připíše sestavě jen vyloučení mezi jejími vlastními členy', () => {
    const vylouceni = [{ kdo: 'pirati', koho: 'ano', deklarace: 'pirati-strategie' }]
    const k = minimalniKoalice(zari, 65, vylouceni)
    const najdi = (s: string) => k.find((x) => x.clenove.join('+') === s)
    expect(najdi('ano+pirati+praha-sobe')?.vylouceni).toEqual(vylouceni)
    expect(najdi('pirati+spolu+stan')?.vylouceni).toEqual([])
    expect(najdi('ano+stan')?.vylouceni).toEqual([])
  })
})
