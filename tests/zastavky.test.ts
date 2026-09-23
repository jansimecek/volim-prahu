import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { popisLinek } from '../src/components/Zastavka'
import type { ZastavkyMistnosti } from '../src/lib/zastavkyTypy'

const data: ZastavkyMistnosti = JSON.parse(
  readFileSync(join(process.cwd(), 'data/mistnosti/zastavky.json'), 'utf8'),
)
const mistnosti: { mestskaCast: string; mistnosti: { adresa: string }[] }[] = JSON.parse(
  readFileSync(join(process.cwd(), '.velite/volebniMistnosti.json'), 'utf8'),
)

/**
 * Zastávka u volební místnosti je odvozený údaj: generuje ho
 * `pnpm import:zastavky` z otevřených dat PID nad polohou místnosti. Špatně
 * spárovaná adresa by voliče poslala k jiné zastávce, než kde skutečně
 * vystupuje, a poznal by to až na místě.
 */
describe('nejbližší zastávka volební místnosti', () => {
  it('se váže na místnost, která v obsahu opravdu je', () => {
    const znameAdresy = new Set(
      mistnosti.flatMap((s) => s.mistnosti.map((m) => `${s.mestskaCast}|${m.adresa}`)),
    )
    const cizi = data.mistnosti.filter((m) => !znameAdresy.has(`${m.mestskaCast}|${m.adresa}`))
    expect(cizi.map((m) => `${m.mestskaCast} — ${m.adresa}`)).toEqual([])
  })

  it('je u každé adresy nejvýš jednou', () => {
    const klice = data.mistnosti.map((m) => `${m.mestskaCast}|${m.adresa}`)
    expect(klice.length).toBe(new Set(klice).size)
  })

  it('drží vzdálenost v rozsahu, který dává smysl pro pěší docházku', () => {
    const mimo = data.mistnosti.filter((m) => m.zastavka.metru < 0 || m.zastavka.metru > 1000)
    expect(mimo.map((m) => `${m.adresa}: ${m.zastavka.metru} m`)).toEqual([])
  })

  it('má u každé zastávky název i aspoň jednu linku', () => {
    const neuplne = data.mistnosti.filter(
      (m) => m.zastavka.nazev.trim() === '' || m.zastavka.linky.length === 0,
    )
    expect(neuplne.map((m) => m.adresa)).toEqual([])
  })

  it('uvádí zdroj dat', () => {
    expect(data.zdroj.url).toMatch(/^https:\/\/data\.pid\.cz\//)
    expect(data.zdroj.generovano).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })
})

describe('výpis linek', () => {
  it('řadí podle druhu dopravy a spojuje čísla', () => {
    expect(
      popisLinek([
        { nazev: 'C', typ: 'metro' },
        { nazev: '9', typ: 'tram' },
        { nazev: '22', typ: 'tram' },
        { nazev: '176', typ: 'bus' },
      ]),
    ).toBe('metro C · tram 9, 22 · bus 176')
  })

  it('u velkého uzlu seznam utne', () => {
    const linky = Array.from({ length: 12 }, (_, i) => ({ nazev: String(i + 1), typ: 'bus' }))
    expect(popisLinek(linky).endsWith('…')).toBe(true)
  })

  it('neznámý druh dopravy vypíše, jak přišel — nevymýšlí překlad', () => {
    expect(popisLinek([{ nazev: '1', typ: 'cablecar' }])).toBe('cablecar 1')
  })
})
