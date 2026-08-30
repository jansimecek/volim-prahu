import { describe, expect, it } from 'vitest'
import { aktuality as vse } from '#content'
import {
  NA_STRANU,
  denCesky,
  hodinaCesky,
  poDnech,
  publikovane,
  rozmeryObrazku,
  strankaZe,
} from '../src/lib/aktuality'

/**
 * Stránkování a seskupení po dnech se v produkci poprvé spustí až u třicáté
 * aktuality, respektive v den voleb. Do té doby je ten kód nespuštěný —
 * proto se testuje tady, ne až na webu.
 */

const kus = (slug: string, vydano: string, koncept = false) =>
  ({ slug, vydano, koncept, nadpis: slug, shrnuti: slug }) as never

describe('výběr aktualit', () => {
  it('aktualita s budoucím časem se nezveřejní dřív, než ten čas nastane', () => {
    const budouci = vse.filter((z) => Date.parse(z.vydano) > Date.now())
    const ted = publikovane()
    for (const z of budouci) expect(ted.map((x) => x.slug)).not.toContain(z.slug)
  })

  it('vydané aktuality jdou od nejnovější', () => {
    const casy = publikovane().map((z) => Date.parse(z.vydano))
    expect(casy).toEqual([...casy].sort((a, b) => b - a))
  })
})

describe('stránkování', () => {
  const vse = publikovane()

  it('prázdná rubrika má jednu stranu, ne nulu', () => {
    // Nula stran by znamenala dělení nulou v odkazech a „strana 1 z 0".
    expect(strankaZe([], 1).celkem).toBe(1)
    expect(strankaZe([], 1).aktuality).toEqual([])
  })

  it.each([0, -5, 1.7])('nesmyslný vstup %s se ořízne na první stranu', (vstup) => {
    expect(strankaZe(vse, vstup).cislo).toBe(1)
  })

  it('strana za posledním číslem se ořízne, aby to volající poznal', () => {
    const { celkem } = strankaZe(vse, 1)
    // Stránka to porovná s požadovaným číslem a vrátí 404 místo duplicity.
    expect(strankaZe(vse, celkem + 10).cislo).toBe(celkem)
  })

  it('na jedné straně nikdy není víc položek, než dovoluje NA_STRANU', () => {
    expect(strankaZe(vse, 1).aktuality.length).toBeLessThanOrEqual(NA_STRANU)
  })

  it('rozdělí přesně a nic neztratí ani nezdvojí', () => {
    const hodne = Array.from({ length: NA_STRANU * 2 + 3 }, (_, i) =>
      ({ slug: `a${i}`, vydano: `2026-08-${String((i % 28) + 1).padStart(2, '0')}T12:00:00+02:00` }) as never,
    )
    const { celkem } = strankaZe(hodne, 1)
    expect(celkem).toBe(3)
    const posbirane = [1, 2, 3].flatMap((n) => strankaZe(hodne, n).aktuality)
    expect(posbirane).toHaveLength(hodne.length)
    expect(new Set(posbirane.map((x) => x.slug)).size).toBe(hodne.length)
  })
})

describe('seskupení po dnech', () => {
  it('spojí položky ze stejného pražského dne a rozdělí různé', () => {
    const skupiny = poDnech([
      kus('a', '2026-10-09T20:00:00+02:00'),
      kus('b', '2026-10-09T08:30:00+02:00'),
      kus('c', '2026-10-08T23:00:00+02:00'),
    ])
    expect(skupiny.map((s) => s.aktuality.map((z) => z.slug))).toEqual([['a', 'b'], ['c']])
  })

  it('den se počítá v pražském čase, ne v UTC', () => {
    // 23:30 SELČ je 21:30 UTC téhož dne, ale 00:30 SELČ je 22:30 UTC dne
    // předchozího — v UTC by tyhle dvě položky spadly do jednoho dne.
    const skupiny = poDnech([
      kus('pozde', '2026-10-09T23:30:00+02:00'),
      kus('brzy', '2026-10-10T00:30:00+02:00'),
    ])
    expect(skupiny).toHaveLength(2)
    expect(denCesky('2026-10-10T00:30:00+02:00')).toContain('10.')
    expect(hodinaCesky('2026-10-09T23:30:00+02:00')).toBe('23:30')
  })

  it('prázdný seznam nevyrobí prázdnou skupinu', () => {
    expect(poDnech([])).toEqual([])
  })
})

describe('rozměry obrázku aktuality', () => {
  it('sjednotí lokální soubor a adresu v Blobu na jeden tvar', () => {
    expect(
      rozmeryObrazku({
        soubor: { src: '/static/a.png', width: 800, height: 600 },
        alt: 'a',
        zdroj: 'a',
      } as never),
    ).toEqual({ src: '/static/a.png', sirka: 800, vyska: 600 })

    expect(
      rozmeryObrazku({
        url: 'https://blob.example/a.png',
        sirka: 800,
        vyska: 600,
        alt: 'a',
        zdroj: 'a',
      } as never),
    ).toEqual({ src: 'https://blob.example/a.png', sirka: 800, vyska: 600 })
  })

  it('bez rozměrů radši nic než rozbité rozvržení', () => {
    // Schéma tenhle stav nepustí, ale komponenta se na to nesmí spoléhat.
    expect(rozmeryObrazku({ url: 'https://blob.example/a.png', alt: 'a', zdroj: 'a' } as never)).toBeNull()
  })
})
