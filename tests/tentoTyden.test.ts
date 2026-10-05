import { describe, expect, it } from 'vitest'
import { tentoTyden } from '../src/lib/tentoTyden'

/**
 * Přehled volebního týdne na titulní straně. Nejhorší chyby: den, který
 * se posune kvůli UTC, a termín, který zůstane viset, když už proběhl.
 */
describe('volební týden', () => {
  it('dny jdou chronologicky a dnešek je označený pražským datem', () => {
    // 6. 10. v 0:30 pražského času = 5. 10. 22:30 UTC.
    const dny = tentoTyden(new Date('2026-10-05T22:30:00Z'))
    expect(dny[0]!.den).toBe('2026-10-06')
    expect(dny[0]!.dnes).toBe(true)
    expect(dny.map((d) => d.den)).toEqual(dny.map((d) => d.den).sort())
  })

  it('proběhlé dny se nevypisují', () => {
    const dny = tentoTyden(new Date('2026-10-09T10:00:00Z'))
    expect(dny.every((d) => d.den >= '2026-10-09')).toBe(true)
    expect(dny[0]!.udalosti.map((u) => u.cas)).toContain('14:00–22:00')
  })

  it('po druhém kole senátních voleb je seznam prázdný', () => {
    expect(tentoTyden(new Date('2026-10-18T10:00:00Z'))).toEqual([])
  })

  it('víc denní termín má vlastní popisek', () => {
    const senat = tentoTyden(new Date('2026-10-12T10:00:00Z'))
    expect(senat).toHaveLength(1)
    expect(senat[0]!.popisek).toBe('pátek 16. a sobota 17. října')
  })
})
