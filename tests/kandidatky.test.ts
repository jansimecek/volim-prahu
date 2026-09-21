import { describe, expect, it } from 'vitest'
import {
  POPIS_NEPLATNE_KANDIDATURY,
  jeSkrtnutyKandidat,
  lidr,
  platniKandidati,
  type StranaNaKandidatce,
} from '../src/lib/kandidatky'
import {
  MEZ_MLADEHO_KANDIDATA,
  POPIS_MLADEHO_KANDIDATA,
  jeMladyKandidat,
  lzeFiltrovatPodleVeku,
} from '../src/lib/vekKandidata'

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

/**
 * Označení kandidátů pod mezí věku. Mez je sdílená pro komunální listinu
 * i senátní obvod, takže se testuje na jednom místě — kdyby si ji některá
 * tabulka přepsala, web by o témž člověku tvrdil dvě věci.
 */
describe('mez věku kandidáta', () => {
  it('je ostrá — kdo mez právě dosáhl, označený není', () => {
    expect(jeMladyKandidat(MEZ_MLADEHO_KANDIDATA - 1)).toBe(true)
    expect(jeMladyKandidat(MEZ_MLADEHO_KANDIDATA)).toBe(false)
    expect(jeMladyKandidat(MEZ_MLADEHO_KANDIDATA + 1)).toBe(false)
  })

  it('označí i nejmladšího možného kandidáta', () => {
    // Do zastupitelstva obce se kandiduje od 18 let, takže tahle hodnota
    // v datech reálně je a nesmí propadnout kontrolou na chybějící údaj.
    expect(jeMladyKandidat(18)).toBe(true)
  })

  it('nulu bere jako chybějící údaj, ne jako mladého kandidáta', () => {
    // Import dělá z nevyplněného VEK nulu (`Number(radek.VEK ?? 0)`).
    // Kdyby nula prošla, web by u člověka bez údaje tvrdil, že je do 40.
    expect(jeMladyKandidat(0)).toBe(false)
    expect(jeMladyKandidat(-1)).toBe(false)
  })

  it('vysvětlivka neuvádí rozhodný den, protože ho neuvádí ani registr', () => {
    // ČSÚ popisuje pole VEK pouhým „Věk". Doplnit si den by znamenalo
    // tvrdit za registr něco, co v něm není.
    expect(POPIS_MLADEHO_KANDIDATA).toContain('registr neuvádí')
  })

  it('vysvětlivka říká, že označení není doporučení', () => {
    // Zvýrazněná část listiny se sama o sobě čte jako rada, koho volit.
    expect(POPIS_MLADEHO_KANDIDATA).toContain('nedoporučuje')
  })
})

describe('nabídka filtru podle věku', () => {
  it('se neukáže, když mez nesplňuje nikdo', () => {
    expect(lzeFiltrovatPodleVeku(0, 45)).toBe(false)
  })

  it('se neukáže, když ji splňují všichni — neměl by co schovat', () => {
    expect(lzeFiltrovatPodleVeku(5, 5)).toBe(false)
  })

  it('se ukáže, když má co schovat i co nechat', () => {
    expect(lzeFiltrovatPodleVeku(1, 5)).toBe(true)
  })
})
