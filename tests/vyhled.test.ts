import { vyhled } from '#content'
import { describe, expect, it } from 'vitest'
import { lhutyUstavujichZasedani } from '../src/lib/terminy'
import { sestavVyhled, vyhledOd } from '../src/lib/vyhled'
import type { Vyjednavani } from '../src/lib/vyjednavani'

const lhuty = lhutyUstavujichZasedani('2026-10-13')

const vyjednavani = [
  {
    zastupitelstvo: 'praha-5',
    overeno: '2026-10-23',
    ustavujiciZasedani: { datum: '2026-11-03', zdroj: 'z1' },
    vedeni: [],
    zdroje: [{ id: 'z1', medium: 'Pražský deník', nazev: 'x', datum: '2026-10-20', url: 'https://example.cz/a' }],
    udalosti: [
      {
        id: 'memorandum',
        datum: '2026-10-20',
        typ: 'memorandum',
        subjekty: ['ods'],
        sestava: ['ods'],
        vylucuje: [],
        doklad: 'parafraze',
        shrnuti: 'x',
        zdroje: ['z1'],
      },
    ],
  },
] as unknown as Vyjednavani[]

const plan = {
  id: 'plan',
  zastupitelstvo: 'praha-5',
  datum: '2026-10-24',
  platiDo: '2026-10-31',
  kdy: 'do konce října',
  nadpis: 'Jasno o koalici',
  text: 'Text.',
  udalost: 'memorandum',
}

describe('výhled', () => {
  it('skládá zákonné lhůty, svolaná zasedání a plány podle toho, do kdy mají nastat', () => {
    const t = sestavVyhled('2026-10-20', { lhuty, polozky: [plan], vyjednavani })
    expect(t.map((x) => [x.id, x.druh, x.platiDo])).toEqual([
      ['lhuta-navrhy-soudu', 'lhuta', '2026-10-23'],
      ['plan', 'ohlaseno', '2026-10-31'],
      ['svolano-praha-5', 'svolano', '2026-11-03'],
      ['lhuta-ustavujici-zasedani', 'lhuta', '2026-11-07'],
    ])
  })

  it('plán přebírá zdroj z doložené události', () => {
    const p = sestavVyhled('2026-10-20', { lhuty: null, polozky: [plan], vyjednavani }).find((x) => x.id === 'plan')
    expect(p?.zdroj).toEqual({ text: 'Pražský deník, 20. října 2026', url: 'https://example.cz/a' })
  })

  it('plán bez dohledatelné události nevypíše', () => {
    const t = sestavVyhled('2026-10-20', { lhuty: null, polozky: [{ ...plan, udalost: 'neni' }], vyjednavani })
    expect(t.some((x) => x.id === 'plan')).toBe(false)
  })

  it('uplynulé termíny vynechá, dnešní ještě ukáže', () => {
    const t = sestavVyhled('2026-10-23', { lhuty, polozky: [], vyjednavani: [] })
    expect(t.map((x) => x.id)).toEqual(['lhuta-navrhy-soudu', 'lhuta-ustavujici-zasedani'])
    expect(sestavVyhled('2026-10-24', { lhuty, polozky: [], vyjednavani: [] }).map((x) => x.id)).toEqual([
      'lhuta-ustavujici-zasedani',
    ])
  })

  it('každý plán z content/vyhled.yaml má zdroj', () => {
    // Bez zdroje by plán ze stránky tiše zmizel; tady je to vidět hned.
    const vse = vyhledOd('2000-01-01').filter((x) => x.druh === 'ohlaseno')
    expect(vse.map((x) => x.id).sort()).toEqual(vyhled.polozky.map((p) => p.id).sort())
    for (const t of vse) expect(t.zdroj.url).toMatch(/^https:\/\//)
  })
})
