import { describe, expect, it } from 'vitest'
import { vysledekDruhehoKola, vysledkyObvodu } from '../src/lib/senatVysledky'

describe('výsledky druhého kola Senátu', () => {
  it('zvolený je kandidát s víc hlasy a oba jsou postupující z prvního kola', () => {
    for (const cislo of [21, 24, 27]) {
      const v = vysledekDruhehoKola(cislo)
      expect(v).not.toBeNull()
      expect(v!.zvoleny.hlasy).toBeGreaterThan(v!.souper.hlasy)
      expect(vysledkyObvodu(cislo)!.kolo1.postupuji.sort()).toEqual([v!.zvoleny.cislo, v!.souper.cislo].sort())
    }
  })

  it('hlasy obou kandidátů dávají platné hlasy kola', () => {
    for (const cislo of [21, 24, 27]) {
      const v = vysledekDruhehoKola(cislo)!
      expect(v.zvoleny.hlasy + v.souper.hlasy).toBe(v.kolo.platneHlasy)
    }
  })
})
