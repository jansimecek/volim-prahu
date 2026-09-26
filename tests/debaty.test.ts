import { describe, expect, it } from 'vitest'
import { debaty as data } from '#content'
import { denDebaty, dnesVPraze, rozdelDebaty, ucastniciDebaty } from '../src/lib/debaty'

/**
 * Podle kalendáře si čtenář plánuje večer. Nejhorší chyby jsou dvě: debata,
 * která zmizí z nadcházejících dřív, než začala, a posunutý den.
 */
describe('kalendář debat', () => {
  it('pražské datum platí i v noci, kdy je v UTC ještě včera', () => {
    // 1. 10. 2026 v 0:30 pražského letního času = 30. 9. 22:30 UTC.
    expect(dnesVPraze(new Date('2026-09-30T22:30:00Z'))).toBe('2026-10-01')
  })

  it('debata je mezi nadcházejícími po celý den, kdy se koná', () => {
    const d = data.debaty[0]!
    const den = d.datum.slice(0, 10)
    const vecer = new Date(`${den}T21:30:00Z`) // 23:30 v Praze
    expect(rozdelDebaty(vecer).nadchazejici.map((x) => x.id)).toContain(d.id)
  })

  it('nadcházející od nejbližší, proběhlé od nejnovější, nic se neztratí', () => {
    const { nadchazejici, probehle } = rozdelDebaty(new Date('2026-09-26T12:00:00Z'))
    const n = nadchazejici.map((d) => d.datum)
    const p = probehle.map((d) => d.datum)
    expect(n).toEqual([...n].sort())
    expect(p).toEqual([...p].sort().reverse())
    expect(n.length + p.length).toBe(data.debaty.length)
  })

  it('den v týdnu odpovídá datu z obsahu', () => {
    const ct = data.debaty.find((d) => d.datum.startsWith('2026-10-01'))
    expect(ct && denDebaty(ct)).toBe('čtvrtek 1. října')
  })

  it('účastníci mají jméno z kandidátních listin, ne slug', () => {
    for (const d of data.debaty) {
      for (const u of ucastniciDebaty(d)) expect(u.jmeno).not.toBe(u.slug)
    }
  })
})
