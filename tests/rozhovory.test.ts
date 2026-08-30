import { describe, expect, it } from 'vitest'
import { rozhovory as vse } from '#content'
import { pocetOsobSRozhovorem, rozhovoryOsoby, vsechnyRozhovory } from '../src/lib/rozhovory'

/**
 * Rozhovory jsou citlivý obsah: přisoudit člověku rozhovor, který neposkytl,
 * je stejná chyba jako přisoudit mu výrok. Schéma hlídá tvar, `pnpm validate`
 * existenci osoby a tyhle testy zbytek.
 */
describe('rozhovory s kandidáty', () => {
  it('řadí od nejnovějšího', () => {
    const data = vsechnyRozhovory().map((r) => r.datum)
    expect(data).toEqual([...data].sort().reverse())
  })

  it('výpis jedné osoby obsahuje jen její rozhovory', () => {
    for (const r of vse) {
      const jeji = rozhovoryOsoby(r.osoba)
      expect(jeji.every((x) => x.osoba === r.osoba)).toBe(true)
      expect(jeji.map((x) => x.slug)).toContain(r.slug)
    }
  })

  it('neznámá osoba vrací prázdný seznam, ne výjimku', () => {
    expect(rozhovoryOsoby('takova-osoba-neexistuje')).toEqual([])
  })

  it('počet osob nepřeceňuje pokrytí, když má jeden člověk víc rozhovorů', () => {
    expect(pocetOsobSRozhovorem()).toBeLessThanOrEqual(vse.length)
    expect(pocetOsobSRozhovorem()).toBe(new Set(vse.map((r) => r.osoba)).size)
  })

  it('každý rozhovor má odkaz na cizí web, ne na náš', () => {
    // Text rozhovoru nepřebíráme — odkaz musí vést k tomu, kdo ho udělal.
    for (const r of vse) {
      expect(r.odkaz).toMatch(/^https?:\/\//)
      expect(r.odkaz).not.toContain('volimprahu.cz')
    }
  })

  it('anotace zůstává anotací, ne opisem', () => {
    for (const r of vse) expect(r.anotace.length).toBeLessThanOrEqual(600)
  })
})
