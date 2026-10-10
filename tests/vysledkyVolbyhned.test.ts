import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parsujZastupitelstvo, urlZastupitelstva } from '../src/lib/vysledkyVolbyhned'

/**
 * Záložní zdroj z volbyhned.cz nemá dokumentovaný formát — pole jsou
 * poziční. Vzorky jsou zkrácené ostré soubory: konečný stav 2022 (proti
 * známým výsledkům) a průběžný stav 2026, kde mandáty ještě chybí.
 */
const nacti = (soubor: string): unknown =>
  JSON.parse(readFileSync(join(__dirname, 'fixtures', soubor), 'utf8'))

describe('záložní zdroj volbyhned.cz', () => {
  it('rozumí známým výsledkům magistrátu 2022', () => {
    const m = parsujZastupitelstvo(nacti('volbyhned-kv2022-magistrat.json'), '554782', 'magistrat')
    expect(m.slug).toBe('magistrat')
    expect(m.mandatuCelkem).toBe(65)
    expect(m.okrskyCelkem).toBe(1123)
    expect(m.okrskyZpracovano).toBe(1123)
    expect(m.ucastProcenta).toBe(43.91)
    expect(m.spocteno).toBe(true)
    expect(m.strany[0]).toMatchObject({
      nazev: 'SPOLU pro Prahu (ODS, TOP 09, KDU-ČSL)',
      procenta: 24.72,
      mandaty: 19,
    })
    expect(m.strany.slice(0, 5).map((s) => s.mandaty)).toEqual([19, 14, 13, 11, 5])
    expect(m.strany.reduce((n, s) => n + s.mandaty, 0)).toBe(65)
    expect(m.strany.reduce((n, s) => n + s.hlasy, 0)).toBe(m.platneHlasy)
  })

  it('volební heslo místo názvu nahradí zkráceným názvem', () => {
    const m = parsujZastupitelstvo(nacti('volbyhned-kv2022-magistrat.json'), '554782', 'magistrat')
    expect(m.strany.every((s) => s.nazev.length <= 80)).toBe(true)
    expect(m.strany.find((s) => s.cislo === 7)?.nazev).toBe('Volte Pr.Blok www.cibulka.net')
  })

  it('průběžný stav bez mandátů načte s nulami', () => {
    const m = parsujZastupitelstvo(nacti('volbyhned-kv2026-prubezne.json'), '554782', 'magistrat')
    expect(m.spocteno).toBe(false)
    expect(m.okrskyCelkem).toBe(1120)
    expect(m.okrskyZpracovano).toBeGreaterThan(0)
    expect(m.okrskyZpracovano).toBeLessThan(m.okrskyCelkem)
    expect(m.strany.length).toBeGreaterThan(0)
    expect(m.strany.every((s) => s.mandaty === 0)).toBe(true)
    expect(m.strany.reduce((n, s) => n + s.hlasy, 0)).toBe(m.platneHlasy)
    expect(m.generovano).toMatch(/^2026-10-10T/)
  })

  it('odmítne soubor jiného zastupitelstva', () => {
    expect(() =>
      parsujZastupitelstvo(nacti('volbyhned-kv2022-magistrat.json'), '500054', 'praha-1'),
    ).toThrow(/jinému zastupitelstvu/)
  })

  it('odmítne soubor neznámého tvaru', () => {
    expect(() =>
      parsujZastupitelstvo({ param: { kodzastup: 554782 }, prehled: [65] }, '554782', 'magistrat'),
    ).toThrow(/neznámý tvar/)
  })

  it('míří na okres Praha a sadu 2026', () => {
    expect(urlZastupitelstva('554782')).toBe(
      'https://www.volbyhned.cz/appdata/kv2026/20261009/vysled/1100/554782.json',
    )
  })
})
