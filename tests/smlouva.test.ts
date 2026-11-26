import { describe, expect, it } from 'vitest'
import { kotvaRadniho, radaMagistratu } from '@/lib/rada'
import {
  jePodmineny,
  jeProverovaci,
  maCislo,
  maLetopocet,
  mereniSmlouvy,
  oddilyRadniho,
  smlouva,
  vsechnyZavazky,
} from '@/lib/smlouva'

describe('koaliční smlouva 2026–2030', () => {
  it('drží všech 137 odrážek dokumentu z praha.eu', () => {
    // Počet je vlastnost zveřejněného dokumentu, ne našeho zápisu. Když se
    // změní, buď město vydalo nové znění, nebo se při úpravě ztratila odrážka.
    expect(vsechnyZavazky()).toHaveLength(137)
    expect(smlouva.kapitoly).toHaveLength(10)
  })

  it('znění zůstává doslovné, bez stop po zalomení řádků z PDF', () => {
    for (const z of vsechnyZavazky()) {
      expect(z.zneni, z.id).not.toMatch(/\s{2,}/)
      expect(z.zneni, z.id).not.toMatch(/\p{L}- \p{Ll}/u)
      expect(z.zneni.trim(), z.id).toBe(z.zneni)
    }
  })

  it('opakování počítá jednou', () => {
    const m = mereniSmlouvy()
    expect(m.celkem - m.jedinecnych).toBe(vsechnyZavazky().filter((z) => z.opakuje).length)
    expect(m.sCislem).toBeLessThanOrEqual(m.jedinecnych)
  })

  it('strojové příznaky rozpoznají typické formulace', () => {
    expect(maCislo('zahájit přípravu alespoň 1000 bytů')).toBe(true)
    expect(maCislo('podpoříme Metro D')).toBe(false)
    expect(maLetopocet('do roku 2030 zajistíme')).toBe(true)
    expect(maLetopocet('kapacitu 900 tisíc hodin')).toBe(false)
    expect(jeProverovaci('Prověříme možnosti zapojení dalších forem')).toBe(true)
    expect(jeProverovaci('Zanalyzujeme kontinuitu sítě')).toBe(true)
    expect(jeProverovaci('Zprovozníme rozestavěné tramvajové tratě.')).toBe(false)
    expect(jeProverovaci('na principech, které budou prověřeny podrobnou právní a ekonomickou analýzou')).toBe(false)
    expect(jeProverovaci('Připravíme studii proveditelnosti')).toBe(true)
    expect(jePodmineny('Umožní-li to zákonná úprava, přeneseme pravomoc')).toBe(true)
  })
})

describe('rada hlavního města', () => {
  it('má všech jedenáct členů s funkcí z vedení i údaji z kandidátky', () => {
    const rada = radaMagistratu()
    expect(rada).toHaveLength(11)
    expect(rada[0]?.funkce).toBe('primátor')
    for (const c of rada) {
      expect(c.kandidatura?.prijmeni, c.jmeno).toBe(c.jmeno.split(' ').at(-1))
      expect(c.gesce.length, c.jmeno).toBeGreaterThan(0)
    }
  })

  it('každý oddíl smlouvy s radním vede na existujícího člena rady', () => {
    const jmena = new Set(radaMagistratu().map((c) => c.jmeno))
    for (const k of smlouva.kapitoly)
      for (const o of k.oddily) for (const r of o.radni) expect(jmena.has(r), `${o.id}: ${r}`).toBe(true)
    expect(oddilyRadniho('Adam Scheinherr').map((o) => o.oddil.id)).toEqual(['doprava'])
  })

  it('kotva radního nemá diakritiku ani mezery', () => {
    expect(kotvaRadniho('Alexandra Udženija')).toBe('radni-alexandra-udzenija')
    expect(kotvaRadniho('Antonín Klecanda')).toBe('radni-antonin-klecanda')
  })
})
