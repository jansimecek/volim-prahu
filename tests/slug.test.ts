import { describe, expect, it } from 'vitest'
import { slugKandidata, slugZastupitelstva, slugify } from '../src/lib/slug'

describe('slugify', () => {
  it('odstraní českou diakritiku', () => {
    expect(slugify('Praha-Běchovice')).toBe('praha-bechovice')
    expect(slugify('Praha-Přední Kopanina')).toBe('praha-predni-kopanina')
    expect(slugify('Praha-Ďáblice')).toBe('praha-dablice')
    expect(slugify('Praha-Řeporyje')).toBe('praha-reporyje')
    expect(slugify('Praha-Újezd')).toBe('praha-ujezd')
    expect(slugify('Praha-Šeberov')).toBe('praha-seberov')
  })
})

describe('slugZastupitelstva', () => {
  it('mapuje hlavní město na magistrat', () => {
    expect(slugZastupitelstva('Praha hl.m.', '554782')).toBe('magistrat')
  })
  it('mapuje číslované části', () => {
    expect(slugZastupitelstva('Praha 7', '500186')).toBe('praha-7')
  })
})

describe('slugKandidata', () => {
  it('řeší kolize deterministicky', () => {
    const obsazene = new Set<string>()
    expect(slugKandidata('Novák', 'Jan', obsazene)).toBe('novak-jan')
    expect(slugKandidata('Novák', 'Jan', obsazene)).toBe('novak-jan-2')
    expect(slugKandidata('Novák', 'Jan', obsazene)).toBe('novak-jan-3')
  })
})
