import { describe, expect, it } from 'vitest'
import {
  MORATORIUM_DO,
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
  it('má vyplněnou právní oporu i datum, jinak zůstává fail-closed', () => {
    // Datum bez citace ustanovení je jen číslo, které nikdo neumí ověřit.
    expect(Boolean(MORATORIUM_OD) === Boolean(PRAVNI_OPORA)).toBe(true)
    if (PRAVNI_OPORA) {
      // Po volební reformě 2025/2026 už moratorium není ve volebním zákoně.
      // Kdyby se opora vrátila na § 30 odst. 3 zákona 491/2001 Sb., je to chyba.
      expect(PRAVNI_OPORA).toContain('234/2025')
      expect(PRAVNI_OPORA).not.toContain('491/2001')
    }
  })

  it('lhůta začíná třetí den přede dnem voleb a končí ukončením hlasování', () => {
    if (!MORATORIUM_OD || !PRAVNI_OPORA) return
    // Den voleb je pátek 9. 10. 2026 → třetí den přede dnem voleb je úterý 6. 10.
    expect(MORATORIUM_OD.toISOString()).toBe(new Date('2026-10-06T00:00:00+02:00').toISOString())
    expect(MORATORIUM_DO.toISOString()).toBe(new Date('2026-10-10T14:00:00+02:00').toISOString())
  })

  it('hranice lhůty jsou uzavřené na začátku a otevřené na konci', () => {
    if (!MORATORIUM_OD || !PRAVNI_OPORA) return
    const tesnePred = new Date('2026-10-05T23:59:59+02:00')
    const prvniOkamzik = new Date('2026-10-06T00:00:00+02:00')
    const konec = new Date('2026-10-10T14:00:00+02:00')

    expect(smiZobrazitPruzkum(tesnePred)).toBe(true)
    expect(smiZobrazitPruzkum(prvniOkamzik)).toBe(false)
    expect(smiZobrazitPruzkum(new Date('2026-10-09T18:00:00+02:00'))).toBe(false)
    // Přesně ve 14:00 hlasování končí, takže zákaz už neplatí.
    expect(smiZobrazitPruzkum(konec)).toBe(true)
  })

  it.each([
    ['2026-09-01T12:00:00+02:00', 'pred-moratoriem'],
    ['2026-10-06T00:00:01+02:00', 'behem-moratoria'],
    ['2026-10-10T14:00:01+02:00', 'po-volbach'],
  ])('stav v %s je %s', (kdy, ocekavany) => {
    if (!MORATORIUM_OD || !PRAVNI_OPORA) return
    expect(stavMoratoria(new Date(kdy))).toBe(ocekavany)
  })

  it('důvod skrytí cituje ustanovení, ne jen obecnou větu o zákonu', () => {
    const duvod = duvodSkryti(new Date('2026-10-08T12:00:00+02:00'))
    expect(duvod.length).toBeGreaterThan(40)
    if (PRAVNI_OPORA) expect(duvod).toContain(PRAVNI_OPORA)
  })

  it('mimo lhůtu se nic neskrývá, takže není co vysvětlovat', () => {
    if (!MORATORIUM_OD || !PRAVNI_OPORA) return
    expect(duvodSkryti(new Date('2026-09-01T12:00:00+02:00'))).toBe('')
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
