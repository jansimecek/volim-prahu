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

describe('kontrast palety na podkladu papíru', () => {
  const papir = token('papir')

  it.each(['inkoust', 'seda-uredni', 'praha', 'okr'])(
    '%s splňuje WCAG 2.2 AA pro běžný text (4.5:1)',
    (nazev) => {
      expect(kontrast(token(nazev), papir)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('linka a tmavší papír zůstávají jen dekorativní plochy, ne text', () => {
    // Kdyby někdo těmito tokeny obarvil text, kontrast by neprošel — proto
    // je test drží explicitně pod hranicí a připomíná, k čemu slouží.
    expect(kontrast(token('linka'), papir)).toBeLessThan(4.5)
  })
})
