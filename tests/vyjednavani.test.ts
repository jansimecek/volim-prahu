import { describe, expect, it } from 'vitest'
import { KONECNE_VYSLEDKY } from '../src/lib/konecneVysledky'
import { dohodnutaSestava, rozlozeniMandatu, stavVyjednavani, type Vyjednavani } from '../src/lib/vyjednavani'

/** Minimální soubor vyjednávání s danými událostmi. */
function s(udalosti: { typ: string; datum: string; sestava?: string[] }[]): Vyjednavani {
  return {
    zastupitelstvo: 'test',
    overeno: '2026-10-13',
    vedeni: [],
    zdroje: [],
    udalosti: udalosti.map((u, i) => ({
      id: `u${i}`,
      subjekty: ['a'],
      sestava: u.sestava ?? [],
      vylucuje: [],
      doklad: 'parafraze',
      shrnuti: 'x',
      zdroje: ['z'],
      ...u,
    })),
  } as unknown as Vyjednavani
}

describe('stav vyjednávání', () => {
  it('bez událostí je „bez zpráv“, s jednáním „jednání“', () => {
    expect(stavVyjednavani(undefined)).toBe('bez-zprav')
    expect(stavVyjednavani(s([{ typ: 'jednani', datum: '2026-10-12' }]))).toBe('jednani')
  })

  it('ohlášená dohoda je víc než jednání a ukáže sestavu', () => {
    const v = s([
      { typ: 'jednani', datum: '2026-10-11' },
      { typ: 'dohoda', datum: '2026-10-12', sestava: ['a', 'b'] },
    ])
    expect(stavVyjednavani(v)).toBe('dohoda')
    expect(dohodnutaSestava(v)).toEqual(['a', 'b'])
  })

  it('pozdější jednání stav dohody nesníží, rozpad ano', () => {
    const dohoda = { typ: 'dohoda', datum: '2026-10-12', sestava: ['a', 'b'] }
    expect(stavVyjednavani(s([dohoda, { typ: 'jednani', datum: '2026-10-13' }]))).toBe('dohoda')
    const rozpad = s([dohoda, { typ: 'rozpad', datum: '2026-10-14' }])
    expect(stavVyjednavani(rozpad)).toBe('jednani')
    expect(dohodnutaSestava(rozpad)).toBeUndefined()
  })

  it('memorandum po dohodě stav posune, dohoda po smlouvě ho nevrátí', () => {
    expect(
      stavVyjednavani(
        s([
          { typ: 'dohoda', datum: '2026-10-12', sestava: ['a'] },
          { typ: 'memorandum', datum: '2026-10-20', sestava: ['a'] },
        ]),
      ),
    ).toBe('memorandum')
    expect(
      stavVyjednavani(
        s([
          { typ: 'koalicni-smlouva', datum: '2026-10-20', sestava: ['a'] },
          { typ: 'dohoda', datum: '2026-10-21', sestava: ['a'] },
        ]),
      ),
    ).toBe('koalicni-smlouva')
  })
})

describe('rozložení mandátů', () => {
  const z = (slug: string) => KONECNE_VYSLEDKY.zastupitelstva.find((x) => x.slug === slug)!

  it('jediná kandidátka, samostatná většina a bez většiny podle výsledků 2026', () => {
    expect(rozlozeniMandatu(z('praha-troja')).typ).toBe('jedina-kandidatka')
    expect(rozlozeniMandatu(z('praha-7')).typ).toBe('samostatna-vetsina')
    expect(rozlozeniMandatu(z('magistrat')).typ).toBe('bez-vetsiny')
  })

  it('v Praze je devět městských částí s jedinou kandidátkou', () => {
    const jedine = KONECNE_VYSLEDKY.zastupitelstva.filter((x) => rozlozeniMandatu(x).typ === 'jedina-kandidatka')
    expect(jedine.map((x) => x.slug).sort()).toEqual([
      'praha-bechovice',
      'praha-benice',
      'praha-brezineves',
      'praha-kralovice',
      'praha-lochkov',
      'praha-nedvezi',
      'praha-predni-kopanina',
      'praha-sterboholy',
      'praha-troja',
    ])
  })
})
