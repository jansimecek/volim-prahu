import { describe, expect, it } from 'vitest'
import { dostupneKlice, serad, type PolozkaKRazeni } from '../src/lib/razeni'

const p = (
  slug: string,
  nazev: string,
  cislo: number | null = null,
  procenta: number | null = null,
): PolozkaKRazeni => ({ slug, nazev, cislo, procenta })

/**
 * Pořadí ve výpisu je redakční rozhodnutí: kdo je nahoře, dostane víc
 * pozornosti. Testy proto hlídají hlavně to, aby se nikdo ze seznamu
 * neztratil a aby subjekty bez dat nepropadly na začátek.
 */
describe('řazení kandidujících subjektů', () => {
  const vzorek = [
    p('zeleni', 'Zelení', 3, 4),
    p('ods', 'ODS', 1, 22.5),
    p('ano', 'ANO', null, 22.5),
    p('cssd', 'ČSSD', 2, null),
  ]

  it('abecedně řadí podle českého pořadí, ne podle ASCII', () => {
    // „Č" patří za „C" a před „D"; localeCompare bez locale by to spletl.
    const poradi = serad([p('a', 'Cesta'), p('b', 'Čáp'), p('c', 'Dům')], 'abecedne')
    expect(poradi.map((x) => x.nazev)).toEqual(['Cesta', 'Čáp', 'Dům'])
  })

  it('podle čísla řadí vzestupně a nevylosované dává na konec', () => {
    expect(serad(vzorek, 'cislo').map((x) => x.nazev)).toEqual([
      'ODS',
      'ČSSD',
      'Zelení',
      'ANO',
    ])
  })

  it('podle průzkumu řadí sestupně a při shodě rozhoduje abeceda', () => {
    // ANO i ODS mají 22,5 % — pořadí mezi nimi nesmí určovat pořadí v datech.
    expect(serad(vzorek, 'pruzkum').map((x) => x.nazev)).toEqual([
      'ANO',
      'ODS',
      'Zelení',
      'ČSSD',
    ])
  })

  it('subjekt bez hodnoty se nikdy nezahodí ani nepřeskočí dopředu', () => {
    for (const klic of ['abecedne', 'cislo', 'pruzkum'] as const) {
      const vysledek = serad(vzorek, klic)
      expect(vysledek).toHaveLength(vzorek.length)
      expect(new Set(vysledek.map((x) => x.slug))).toEqual(new Set(vzorek.map((x) => x.slug)))
    }
  })

  it('nemění vstupní pole', () => {
    const puvodni = [...vzorek]
    serad(vzorek, 'pruzkum')
    expect(vzorek).toEqual(puvodni)
  })

  it('nula procent není totéž co chybějící údaj', () => {
    const seznam = [p('a', 'A', null, null), p('b', 'B', null, 0)]
    // Subjekt změřený na nule je v průzkumu; ten neuvedený patří až za něj.
    expect(serad(seznam, 'pruzkum').map((x) => x.nazev)).toEqual(['B', 'A'])
  })

  it('nabízí jen klíče, ke kterým existují data', () => {
    expect(dostupneKlice([p('a', 'A')])).toEqual(['abecedne'])
    expect(dostupneKlice([p('a', 'A', 1)])).toEqual(['abecedne', 'cislo'])
    expect(dostupneKlice([p('a', 'A', null, 10)])).toEqual(['abecedne', 'pruzkum'])
    expect(dostupneKlice([p('a', 'A', 1, 10)])).toEqual(['abecedne', 'cislo', 'pruzkum'])
  })
})
