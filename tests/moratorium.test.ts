import { describe, expect, it } from 'vitest'
import {
  MORATORIUM_OD,
  PRAVNI_OPORA,
  duvodSkryti,
  smiZobrazitPruzkum,
  stavMoratoria,
} from '../src/lib/moratorium'

/**
 * Moratorium je fail-closed. Tenhle test hlídá, aby se to nedalo omylem
 * obrátit — zveřejnit průzkum v zakázané lhůtě je porušení zákona,
 * zatímco skrytý legální obsah je jen nepříjemnost.
 */
describe('moratorium na předvolební průzkumy', () => {
  it('bez potvrzeného právního základu se průzkumy nezobrazují nikdy', () => {
    if (MORATORIUM_OD && PRAVNI_OPORA) return // až bude ověřeno, platí testy níže
    for (const den of ['2026-06-01', '2026-10-01', '2026-10-08', '2026-10-09']) {
      expect(smiZobrazitPruzkum(new Date(`${den}T12:00:00+02:00`))).toBe(false)
    }
    expect(stavMoratoria(new Date('2026-09-01T12:00:00+02:00'))).toBe('neoveerno')
  })

  it('datum se nesmí použít bez uvedené právní opory', () => {
    // Obojí musí být vyplněné zároveň, jinak zůstává fail-closed.
    expect(Boolean(MORATORIUM_OD) === Boolean(PRAVNI_OPORA) || !smiZobrazitPruzkum()).toBe(true)
  })

  it('po uzavření volebních místností se obsah smí zobrazit, jakmile je ověřeno', () => {
    const poVolbach = new Date('2026-10-10T14:00:01+02:00')
    expect(stavMoratoria(poVolbach)).toBe(MORATORIUM_OD && PRAVNI_OPORA ? 'po-volbach' : 'neoveerno')
  })

  it('důvod skrytí je vždy vysvětlený, nikdy prázdný', () => {
    expect(duvodSkryti(new Date('2026-10-08T12:00:00+02:00')).length).toBeGreaterThan(40)
  })
})

describe('režim webu', () => {
  it('se přepíná podle času, ne podle toho, jestli si na to někdo vzpomene', async () => {
    const { rezimWebu, jeArchiv } = await import('../src/lib/rezim')
    expect(rezimWebu(new Date('2026-09-01T12:00:00+02:00'))).toBe('pred-volbami')
    expect(rezimWebu(new Date('2026-10-09T18:00:00+02:00'))).toBe('volebni-dny')
    expect(rezimWebu(new Date('2026-10-10T18:00:00+02:00'))).toBe('scitani')
    expect(rezimWebu(new Date('2026-10-20T12:00:00+02:00'))).toBe('archiv')
    expect(jeArchiv(new Date('2026-10-20T12:00:00+02:00'))).toBe(true)
    expect(jeArchiv(new Date('2026-09-01T12:00:00+02:00'))).toBe(false)
  })

  it('v archivu je vždy vysvětlení, proč je to archiv', async () => {
    const { POPIS_REZIMU } = await import('../src/lib/rezim')
    expect(POPIS_REZIMU.archiv).toContain('archiv')
    expect(POPIS_REZIMU['pred-volbami']).toBeNull()
  })
})
