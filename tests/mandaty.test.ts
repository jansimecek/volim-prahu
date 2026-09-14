import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { rozdelMandaty } from '../src/lib/mandaty'

type Volby = {
  zdroj: string
  zastupitelstva: {
    kod: string
    nazev: string
    mandatu: number
    platnychHlasu: number
    strany: { cislo: number; hlasy: number; kandidatu: number; mandaty: number }[]
  }[]
}

const volby2022 = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/fixtures/mandaty-praha-2022.json'), 'utf8'),
) as Volby

const s = (id: string, hlasy: number, kandidatu: number) => ({ id, hlasy, kandidatu })

/**
 * Kalkulačka na webu tvrdí, že počítá podle zákona. To tvrzení drží tenhle
 * test: oficiální rozdělení mandátů z voleb 2022 ve všech 58 pražských
 * zastupitelstvech, jak ho zveřejnil ČSÚ, a okrajové případy z § 45, které
 * v Praze v roce 2022 nenastaly.
 */
describe('přepočet hlasů na mandáty podle § 45 zákona o volbách do zastupitelstev obcí', () => {
  it('reprodukuje oficiální rozdělení mandátů 2022 ve všech 58 pražských zastupitelstvech', () => {
    expect(volby2022.zastupitelstva).toHaveLength(58)
    for (const z of volby2022.zastupitelstva) {
      const r = rozdelMandaty(
        z.strany.map((x) => s(String(x.cislo), x.hlasy, x.kandidatu)),
        z.mandatu,
        z.platnychHlasu,
      )
      const spocteno = Object.fromEntries(r.strany.map((x) => [x.id, x.mandaty]))
      const oficialne = Object.fromEntries(z.strany.map((x) => [String(x.cislo), x.mandaty]))
      expect(spocteno, z.nazev).toEqual(oficialne)
    }
  })

  it('stranu s neúplnou kandidátkou měří úměrně nižší hranicí', () => {
    // C má 3 % všech hlasů, ale jen 2 kandidáty z 10 — hranice je pro ni pětina z 5 %.
    const r = rozdelMandaty([s('A', 9000, 10), s('B', 700, 10), s('C', 300, 2)], 10)
    expect(r.klauzule).toBe(5)
    expect(r.strany.find((x) => x.id === 'C')?.postupuje).toBe(true)
  })

  it('stranu přesně na pěti procentech pustí dál a těsně pod nimi ne', () => {
    const presne = rozdelMandaty([s('A', 60, 65), s('B', 35, 65), s('C', 5, 65)], 65, 100)
    expect(presne.strany.map((x) => x.postupuje)).toEqual([true, true, true])
    const pod = rozdelMandaty([s('A', 60, 65), s('B', 35, 65), s('C', 4.99, 65)], 65, 100)
    expect(pod.strany.map((x) => x.postupuje)).toEqual([true, true, false])
    expect(pod.klauzule).toBe(5)
  })

  it('snižuje klauzuli, když by postoupila jen jedna strana', () => {
    const r = rozdelMandaty([s('A', 960, 5), s('B', 40, 5)], 5)
    expect(r.klauzule).toBe(4)
    expect(r.strany.map((x) => x.postupuje)).toEqual([true, true])
  })

  it('snižuje klauzuli dál, dokud postupující nedokážou obsadit nadpoloviční většinu', () => {
    // Při 5 % postoupí A a B, ale se čtyřmi kandidáty obsadí jen 4 mandáty z 9.
    const r = rozdelMandaty([s('A', 800, 2), s('B', 150, 2), s('C', 40, 9)], 9)
    expect(r.klauzule).toBe(4)
    expect(r.strany.map((x) => x.mandaty)).toEqual([2, 2, 5])
  })

  it('u jediné kandidátní listiny se k hranici nepřihlíží', () => {
    const r = rozdelMandaty([s('A', 10, 7)], 7)
    expect(r.klauzule).toBe(0)
    expect(r.strany[0]?.mandaty).toBe(7)
  })

  it('při shodném podílu rozhoduje vyšší celkový počet hlasů strany', () => {
    // Na čtvrtý a pátý mandát vychází podíl 100 u všech tří stran.
    const r = rozdelMandaty([s('A', 300, 5), s('B', 200, 5), s('C', 100, 5)], 5)
    expect(r.strany.map((x) => x.mandaty)).toEqual([3, 2, 0])
    expect(r.los).toBe(false)
  })

  it('pozná, kdy by o mandátu musel rozhodnout los', () => {
    const r = rozdelMandaty([s('A', 100, 3), s('B', 100, 3)], 3)
    expect(r.los).toBe(true)
    expect(r.rozdeleno).toBe(3)
  })

  it('nepřidělí straně víc mandátů, než má kandidátů, a zbylé mandáty nechá neobsazené', () => {
    const r = rozdelMandaty([s('A', 900, 2), s('B', 100, 1)], 5)
    expect(r.strany.map((x) => x.mandaty)).toEqual([2, 1])
    expect(r.rozdeleno).toBe(3)
  })

  it('z procent počítá stejně jako z hlasů, když se klauzule měří ke stu procentům', () => {
    const procenta = [23.3, 22.6, 13.9, 12.9, 10.8, 5.4, 5.0]
    const r = rozdelMandaty(procenta.map((p, i) => s(String(i), p, 65)), 65, 100)
    expect(r.strany.map((x) => x.mandaty)).toEqual([17, 16, 10, 9, 7, 3, 3])
  })
})
