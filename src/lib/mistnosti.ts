/**
 * Volební místnosti — spojení dvou vrstev:
 *
 *  - `content/volebni-mistnosti/<mč>.yaml` píše člověk podle „Oznámení o době
 *    a místě konání voleb" z úřední desky. Autoritativní, ale vyjde až kolem
 *    24. 9. 2026; do té doby může nést údaje z minulých voleb, a web to říká.
 *  - poznámky v RÚIAN — jen Praha 9 si do registru zapisuje adresu místnosti
 *    u každého okrsku. Bereme jako záložní zdroj s viditelnou nálepkou.
 */
import { volebniMistnosti } from '#content'
import { polohaAdresyVPraze } from './geokodovani'
import type { Mistnost } from './mistnostiTypy'
import { MESTSKE_CASTI } from './obsah'
import { adresyMestskeCasti, okrskyMestskeCasti, type Okrsek } from './okrsky'
import type { AdresyMestskeCasti } from './okrskyHledani'
import { zonaMistnosti } from './parkovani'
import { zastavkaMistnosti } from './zastavky'

export { POPIS_ZDROJE, type Mistnost, type TypZdrojeMistnosti } from './mistnostiTypy'

type SouborMistnosti = (typeof volebniMistnosti)[number]

function mistnostiZeSouboru(soubor: SouborMistnosti): Mistnost[] {
  return soubor.mistnosti.map((m) => ({
    nazev: m.nazev,
    adresa: m.adresa,
    okrsky: m.okrsky,
    ...(m.bezbarierova !== undefined ? { bezbarierova: m.bezbarierova } : {}),
    ...(m.poznamka ? { poznamka: m.poznamka } : {}),
    ...(m.poloha ? { poloha: m.poloha } : {}),
    ...(() => {
      const z = zastavkaMistnosti(soubor.mestskaCast, m.adresa)
      return z ? { zastavka: z } : {}
    })(),
    ...(() => {
      const z = zonaMistnosti(soubor.mestskaCast, m.adresa)
      return z !== undefined ? { zona: z } : {}
    })(),
    zdroj: {
      typ: soubor.volby === 'komunalni-2026' ? 'oznameni-2026' : 'drivejsi-volby',
      nazev: soubor.zdroj.nazev,
      url: soubor.zdroj.url,
      overeno: soubor.overeno,
    },
  }))
}

/**
 * „Volební místnost: SOU služeb, Novovysočanská 501/5" → název + adresa.
 * Adresa je ta část za čárkou, která obsahuje číslo domu; Praha 9 občas
 * píše za adresu ještě čtvrť („…Špitálská 789/4, Vysočany").
 */
export function mistnostZPoznamky(poznamka: string | undefined): { nazev: string; adresa: string } | undefined {
  const text = poznamka?.match(/^Volební místnost:\s*(.+)$/)?.[1]?.trim()
  if (!text) return undefined
  const casti = text.split(',').map((c) => c.trim())
  const iAdresy = casti.map((c) => /\d/.test(c)).lastIndexOf(true)
  if (iAdresy <= 0) return { nazev: text, adresa: casti[iAdresy] ?? text }
  return { nazev: casti.filter((_, i) => i !== iAdresy).join(', '), adresa: casti[iAdresy]! }
}

function mistnostZRuian(okrsek: Okrsek): Mistnost | undefined {
  const m = mistnostZPoznamky(okrsek.poznamka)
  if (!m) return undefined
  return {
    ...m,
    okrsky: [okrsek.cislo],
    zdroj: { typ: 'ruian', nazev: 'RÚIAN, poznámka správce okrsku', overeno: okrsek.platiOd },
  }
}

/** Místnosti městské části z redakčního obsahu; prázdné, dokud soubor neexistuje. */
export function mistnostiMestskeCasti(slug: string): Mistnost[] {
  const soubor = volebniMistnosti.find((s) => s.mestskaCast === slug)
  return soubor ? mistnostiZeSouboru(soubor) : []
}

/**
 * Místnosti městské části po okrscích, jak je vydávají obě API okrsků.
 * Redakční obsah má přednost před poznámkou z RÚIAN, a to i když je
 * z minulých voleb — ten aspoň někdo ověřil proti oznámení. Poloha
 * z oznámení má přednost; jinak se adresa místnosti dohledá v registru
 * části, pak v celé Praze.
 */
export function mistnostiPoOkrscich(slug: string, adresy: AdresyMestskeCasti): Record<number, Mistnost> {
  const ostatni = MESTSKE_CASTI.filter((mc) => mc.slug !== slug)
    .map((mc) => adresyMestskeCasti(mc.slug))
    .filter((a): a is AdresyMestskeCasti => a !== null)
  const sPolohou = (m: Mistnost): Mistnost => {
    const poloha = m.poloha ?? polohaAdresyVPraze(m.adresa, adresy, ostatni, m.okrsky)
    return poloha ? { ...m, poloha } : m
  }

  const mistnosti: Record<number, Mistnost> = {}
  for (const m of mistnostiMestskeCasti(slug).map(sPolohou)) for (const o of m.okrsky) mistnosti[o] = m
  for (const o of okrskyMestskeCasti(slug)) {
    if (mistnosti[o.cislo]) continue
    const zRuian = mistnostZRuian(o)
    if (zRuian) mistnosti[o.cislo] = sPolohou(zRuian)
  }
  return mistnosti
}

export type PokrytiMistnosti = {
  okrskuCelkem: number
  /** Okrsky s místností z redakčního obsahu nebo z poznámky RÚIAN. */
  okrskuSMistnosti: number
  /** Z toho podle dokumentu k volbám 2026. */
  okrskuPodle2026: number
  castiSObsahem: number
}

/** Kolik okrsků má známou místnost — pro souhrn na /kde-volim. */
export function pokrytiMistnosti(okrsky: Okrsek[]): PokrytiMistnosti {
  const podle2026 = new Set<number>()
  const pokryte = new Set<number>()
  for (const soubor of volebniMistnosti) {
    for (const m of soubor.mistnosti) {
      for (const o of m.okrsky) {
        pokryte.add(o)
        if (soubor.volby === 'komunalni-2026') podle2026.add(o)
      }
    }
  }
  for (const o of okrsky) if (mistnostZPoznamky(o.poznamka)) pokryte.add(o.cislo)
  return {
    okrskuCelkem: okrsky.length,
    okrskuSMistnosti: [...pokryte].filter((c) => okrsky.some((o) => o.cislo === c)).length,
    okrskuPodle2026: podle2026.size,
    castiSObsahem: new Set(volebniMistnosti.map((s) => s.mestskaCast)).size,
  }
}
