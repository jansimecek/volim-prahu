import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Kontrast se čte přímo z globals.css, ne z kopie hodnot v testu — jinak by
 * test hlídal sám sebe a ne skutečné styly. WCAG 2.2 AA je v zadání
 * nepodkročitelný požadavek, takže ho hlídá build, ne lidská paměť.
 */
const css = readFileSync(join(__dirname, '../src/styles/globals.css'), 'utf8')

function token(nazev: string): string {
  const shoda = css.match(new RegExp(`--color-${nazev}:\\s*(#[0-9a-f]{6})`, 'i'))
  if (!shoda?.[1]) throw new Error(`V globals.css chybí token --color-${nazev}`)
  return shoda[1]
}

function svetlost(hex: string): number {
  const slozky = (hex.replace('#', '').match(/../g) ?? [])
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * slozky[0]! + 0.7152 * slozky[1]! + 0.0722 * slozky[2]!
}

function kontrast(a: string, b: string): number {
  const [svetlejsi, tmavsi] = [svetlost(a), svetlost(b)].sort((x, y) => y - x) as [number, number]
  return (svetlejsi + 0.05) / (tmavsi + 0.05)
}

describe('kontrast palety', () => {
  const papir = token('papir')
  // Dlaždice se při najetí myší přebarvují na tenhle podklad. Kontrast se
  // nesmí posuzovat jen proti výchozímu papíru — text zůstává stejný,
  // plocha pod ním ne, a AA hranice platí v obou stavech.
  const podklady = [
    ['papír', papir],
    ['tmavší papír (hover dlaždic)', token('papir-tmavsi')],
  ] as const

  const textoveTokeny = ['inkoust', 'seda-uredni', 'praha', 'okr']

  for (const [nazevPodkladu, podklad] of podklady) {
    it.each(textoveTokeny)(
      `%s splňuje WCAG 2.2 AA pro běžný text (4.5:1) na podkladu ${nazevPodkladu}`,
      (nazev) => {
        expect(kontrast(token(nazev), podklad)).toBeGreaterThanOrEqual(4.5)
      },
    )
  }

  it.each(podklady.map(([n, h]) => [n, h] as const))(
    'silná linka splňuje netextovou hranici 3:1 na podkladu %s',
    (_nazev, podklad) => {
      // Oddělovače buněk v mřížkách, řádky tabulek a pole razítka nesou
      // informaci o struktuře — WCAG 2.2 (1.4.11) na ni chce 3:1.
      expect(kontrast(token('linka-silna'), podklad)).toBeGreaterThanOrEqual(3)
    },
  )

  it('dekorativní linka zůstává pod hranicí pro text, aby jí nikdo neobarvil písmo', () => {
    expect(kontrast(token('linka'), papir)).toBeLessThan(4.5)
  })

  it('silná linka je opravdu tmavší než dekorativní', () => {
    // Kdyby se hodnoty prohodily, obě role by dělaly opak toho, k čemu jsou.
    expect(svetlost(token('linka-silna'))).toBeLessThan(svetlost(token('linka')))
  })
})
