import { describe, expect, it } from 'vitest'
import { MORATORIUM_DO, MORATORIUM_OD } from '../src/lib/moratorium'
import { duvodBezPruzkumu, pruzkumyUrovne, zobrazitelnyPruzkum } from '../src/lib/pruzkumy'

/**
 * Průzkum je jediný obsah na webu, který dokáže sám o sobě ovlivnit volbu.
 * Testy hlídají obě strany brány: že se v zakázané lhůtě neukáže nic
 * a že se mimo ni neskrývá nic bez vysvětlení.
 */
describe('zveřejnitelnost průzkumů', () => {
  const behemMoratoria = new Date('2026-10-08T12:00:00+02:00')
  const predVolbami = new Date('2026-09-01T12:00:00+02:00')
  // Rozhoduje počet průzkumů PRO MAGISTRÁT, ne celkový. Celostátní sněmovní
  // model v obsahu být může a na pražské řazení nemá vliv.
  const prazskych = pruzkumyUrovne('magistrat').length

  it('v zakázané lhůtě nevrátí průzkum, ani kdyby nějaký byl', () => {
    expect(zobrazitelnyPruzkum('magistrat', behemMoratoria)).toBeNull()
  })

  it('v zakázané lhůtě vysvětluje důvod zákonem — ale jen když je co skrývat', () => {
    const duvod = duvodBezPruzkumu('magistrat', behemMoratoria)
    if (prazskych > 0) {
      expect(duvod).toContain('234/2025')
    } else {
      // Bez jediného průzkumu by věta o zákonu tvrdila, že nějaký zadržujeme.
      expect(duvod).not.toContain('234/2025')
      expect(duvod).toBeTruthy()
    }
  })

  it('po uzavření místností se brána zase otevře', () => {
    // Bez průzkumů v obsahu je výsledek null, ale důvod už není moratorium.
    const poVolbach = new Date(MORATORIUM_DO.getTime() + 60_000)
    const duvod = duvodBezPruzkumu('magistrat', poVolbach)
    if (prazskych === 0) {
      expect(duvod).not.toContain('234/2025')
    } else {
      expect(zobrazitelnyPruzkum('magistrat', poVolbach)).not.toBeNull()
    }
  })

  it('prázdný seznam průzkumů má vysvětlení, ne mlčení', () => {
    if (prazskych > 0) return
    const duvod = duvodBezPruzkumu('magistrat', predVolbami)
    expect(duvod).toBeTruthy()
    expect(duvod!.length).toBeGreaterThan(60)
  })

  it('lhůta v obsahu i v kódu mluví o týchž volbách', () => {
    expect(MORATORIUM_OD!.getUTCFullYear()).toBe(2026)
    expect(MORATORIUM_DO.getUTCFullYear()).toBe(2026)
  })
})

describe('celostátní model neřadí pražské kandidátky', () => {
  it('sněmovní průzkum se nepočítá jako průzkum pro magistrát', () => {
    // Sněmovní model měří jiné strany než pražské volební subjekty a o složení
    // zastupitelstva nevypovídá. Kdyby prosákl do řazení, seřadil by pražské
    // kandidátky podle celostátní nálady — a čtenář by to četl jako předpověď.
    const celostatni = pruzkumyUrovne('celostatni')
    for (const p of celostatni) {
      expect(pruzkumyUrovne('magistrat')).not.toContainEqual(p)
      expect(zobrazitelnyPruzkum('magistrat', new Date('2026-09-01T12:00:00+02:00'))).not.toBe(p)
    }
  })

  it('úroveň se porovnává přesně, ne prefixem', () => {
    for (const p of [...pruzkumyUrovne('celostatni'), ...pruzkumyUrovne('magistrat')]) {
      expect(pruzkumyUrovne(p.uroven)).toContainEqual(p)
    }
  })
})
