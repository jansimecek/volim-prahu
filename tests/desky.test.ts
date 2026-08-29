import { describe, expect, it } from 'vitest'
import { odkazNaDesku, type StavDesky } from '../src/lib/desky'
import { jeOdkazMrtvy, popisChybyOdkazu } from '../src/lib/odkazy'

const stav = (upravy: Partial<StavDesky>): StavDesky => ({
  slug: 'praha-7',
  nazev: 'Praha 7',
  zdroj: 'jen-odkaz',
  stav: 'ceka-se',
  dalsiVolebni: [],
  ...upravy,
})

/**
 * Odkaz na úřední desku je jediné místo, kde volič najde adresu své volební
 * místnosti. Poslat ho na zrušenou stránku je horší než přiznat, že adresu
 * nemáme — z 404 usoudí, že oznámení neexistuje.
 */
describe('odkaz na úřední desku', () => {
  it('ověřenou adresu nabídne', () => {
    expect(odkazNaDesku(stav({ urlDesky: 'https://priklad.cz/deska', deskaDostupna: true }))).toBe(
      'https://priklad.cz/deska',
    )
  })

  it('prokazatelně mrtvou adresu nenabídne', () => {
    expect(
      odkazNaDesku(stav({ urlDesky: 'https://priklad.cz/deska', deskaDostupna: false })),
    ).toBeUndefined()
  })

  it('neověřenou adresu pustí — chybějící příznak není důkaz o nefunkčnosti', () => {
    // Starší data z doby před zavedením kontroly příznak nemají. Skrýt kvůli
    // tomu všechny odkazy by bylo horší než je nechat projít.
    expect(odkazNaDesku(stav({ urlDesky: 'https://priklad.cz/deska' }))).toBe(
      'https://priklad.cz/deska',
    )
  })

  it('bez adresy vrací undefined, ne prázdný řetězec', () => {
    expect(odkazNaDesku(stav({}))).toBeUndefined()
    expect(odkazNaDesku(undefined)).toBeUndefined()
  })
})

describe('klasifikace chyb při ověřování odkazů', () => {
  const chyba = (zprava: string) => Object.assign(new Error('fetch failed'), { cause: new Error(zprava) })

  it('neúplný řetěz certifikátů není mrtvý odkaz', () => {
    // Úřední desky Prahy 2 a Prahy 4 posílají jen koncový certifikát.
    // Prohlížeč si zbytek dotáhne přes AIA, Node ne — kdyby to web bral
    // doslova, zamlčel by voliči adresu, kde hledat volební místnost.
    for (const zprava of [
      'unable to verify the first certificate',
      'unable to get local issuer certificate',
      'self-signed certificate in certificate chain',
    ]) {
      const { druh } = popisChybyOdkazu(chyba(zprava))
      expect(druh).toBe('retez-certifikatu')
      expect(jeOdkazMrtvy(druh)).toBe(false)
    }
  })

  it('vypršení limitu i neznámá chyba znamenají nepoužitelný odkaz', () => {
    expect(jeOdkazMrtvy(popisChybyOdkazu(chyba('The operation timed out')).druh)).toBe(true)
    expect(jeOdkazMrtvy(popisChybyOdkazu(chyba('getaddrinfo ENOTFOUND priklad')).druh)).toBe(true)
  })

  it('popis vysvětluje, na čí straně je vada', () => {
    const { popis } = popisChybyOdkazu(chyba('unable to verify the first certificate'))
    expect(popis).toContain('na straně úřadu')
  })
})
