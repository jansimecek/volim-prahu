import { describe, expect, it } from 'vitest'
import {
  POPIS_NEPLATNE_KANDIDATURY,
  jeSkrtnutyKandidat,
  lidr,
  platniKandidati,
  type StranaNaKandidatce,
} from '../src/lib/kandidatky'

/**
 * ČSÚ nechává škrtnutého kandidáta v datech jako větu místo jména. V Praze 10
 * tak web ukazoval jako lídra „Registrační úřad ponechal pozici volnou".
 */
describe('škrtnutý kandidát', () => {
  it('pozná řádek ČSÚ, který není osoba', () => {
    expect(jeSkrtnutyKandidat('Kandidát v registraci škrtnut', 'Registrační úřad ponechal pozici volnou')).toBe(true)
    expect(jeSkrtnutyKandidat('Novák', 'Jan')).toBe(false)
  })

  it('lídrem je první skutečný kandidát, když je pozice 1 volná', () => {
    const strana = {
      kandidati: [{ poradi: 2, jmeno: 'Jana', prijmeni: 'Nová' }],
      skrtnutePozice: [1],
    } as unknown as StranaNaKandidatce
    expect(lidr(strana)?.prijmeni).toBe('Nová')
  })
})

/**
 * Registr ČSÚ vedl k 9. 9. 2026 sedmnáct pražských kandidatur jako neplatné
 * (PLATNOST=N) a web je ukazoval jako řádné kandidáty, protože import pole
 * nečetl. V Ďáblicích tak na kandidátce ANO stálo patnáct jmen místo pěti.
 */
describe('neplatná kandidatura', () => {
  const strana = {
    kandidati: [
      { poradi: 1, jmeno: 'Jan', prijmeni: 'Novák', neplatny: true },
      { poradi: 2, jmeno: 'Jana', prijmeni: 'Nová' },
      { poradi: 3, jmeno: 'Petr', prijmeni: 'Starý', neplatny: true },
    ],
  } as unknown as StranaNaKandidatce

  it('kandidát s neplatnou kandidaturou kandidátku nevede', () => {
    expect(lidr(strana)?.prijmeni).toBe('Nová')
  })

  it('mezi platné kandidáty se nepočítá', () => {
    expect(platniKandidati(strana).map((k) => k.prijmeni)).toEqual(['Nová'])
  })

  it('vysvětlení nerozhoduje za registr, jestli šlo o vzdání se, nebo odvolání', () => {
    expect(POPIS_NEPLATNE_KANDIDATURY).toContain('vzdání se kandidatury nebo odvolání')
  })
})
