import { describe, expect, it } from 'vitest'
import {
  KONEC_VOLEB,
  hlasovaniOtevrene,
  schemaHlasu,
  schemaOdberu,
  vysledkyZverejnitelne,
} from '../src/lib/hlasovani'

describe('okno ankety', () => {
  const pred = new Date('2026-10-05T12:00:00+02:00')
  const behem = new Date('2026-10-09T18:00:00+02:00')
  const po = new Date('2026-10-10T14:00:01+02:00')

  it('hlasovat jde jen do zavření uren', () => {
    expect(hlasovaniOtevrene(pred)).toBe(true)
    expect(hlasovaniOtevrene(behem)).toBe(true)
    expect(hlasovaniOtevrene(po)).toBe(false)
  })

  it('výsledky se nesmí vydat před koncem voleb', () => {
    expect(vysledkyZverejnitelne(pred)).toBe(false)
    expect(vysledkyZverejnitelne(behem)).toBe(false)
    // ani vteřinu před
    expect(vysledkyZverejnitelne(new Date(KONEC_VOLEB.getTime() - 1))).toBe(false)
  })

  it('výsledky se vydají od okamžiku zavření uren', () => {
    expect(vysledkyZverejnitelne(KONEC_VOLEB)).toBe(true)
    expect(vysledkyZverejnitelne(po)).toBe(true)
  })

  it('okno hlasování a okno výsledků se nikdy nepřekrývají', () => {
    for (const t of [pred, behem, po, KONEC_VOLEB]) {
      expect(hlasovaniOtevrene(t) && vysledkyZverejnitelne(t)).toBe(false)
    }
  })
})

describe('validace vstupu', () => {
  it('přijme platný hlas', () => {
    expect(
      schemaHlasu.safeParse({
        mestskaCast: 'praha-7',
        vekovaKategorie: '30-44',
        uroven: 'magistrat',
        subjekt: 'nejaky-subjekt',
      }).success,
    ).toBe(true)
  })

  it('odmítne neznámou věkovou kategorii', () => {
    expect(
      schemaHlasu.safeParse({
        mestskaCast: 'praha-7',
        vekovaKategorie: '0-17',
        uroven: 'magistrat',
        subjekt: 'x',
      }).success,
    ).toBe(false)
  })

  it('hlas nemá kam propašovat e-mail ani IP', () => {
    const vysledek = schemaHlasu.parse({
      mestskaCast: 'praha-7',
      vekovaKategorie: '30-44',
      uroven: 'magistrat',
      subjekt: 'x',
      email: 'kdo@example.com',
      ip: '1.2.3.4',
    })
    expect(vysledek).not.toHaveProperty('email')
    expect(vysledek).not.toHaveProperty('ip')
  })

  it('odběr přijímá jen e-mail a nic víc', () => {
    const vysledek = schemaOdberu.parse({ email: 'a@b.cz', mestskaCast: 'praha-7' })
    expect(vysledek).toEqual({ email: 'a@b.cz' })
  })
})
