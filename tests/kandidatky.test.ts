import { describe, expect, it } from 'vitest'
import { jeSkrtnutyKandidat, lidr, type StranaNaKandidatce } from '../src/lib/kandidatky'

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
