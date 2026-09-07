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
import { okrsekPodleCisla, type Okrsek } from './okrsky'

import type { Mistnost } from './mistnostiTypy'

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
 * Místnost pro okrsek. Redakční obsah má přednost před poznámkou z RÚIAN,
 * a to i když je z minulých voleb — ten aspoň někdo ověřil proti oznámení.
 */
export function mistnostProOkrsek(cislo: number): Mistnost | undefined {
  const okrsek = okrsekPodleCisla(cislo)
  if (!okrsek) return undefined
  const redakcni = mistnostiMestskeCasti(okrsek.mestskaCast).find((m) => m.okrsky.includes(cislo))
  return redakcni ?? mistnostZRuian(okrsek)
}

/** Které okrsky městské části ještě nemají místnost z žádného zdroje. */
export function okrskyBezMistnosti(slug: string, okrsky: Okrsek[]): number[] {
  const pokryte = new Set(mistnostiMestskeCasti(slug).flatMap((m) => m.okrsky))
  return okrsky
    .filter((o) => o.mestskaCast === slug && !pokryte.has(o.cislo) && !mistnostZPoznamky(o.poznamka))
    .map((o) => o.cislo)
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
