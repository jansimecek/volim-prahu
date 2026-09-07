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

export type TypZdrojeMistnosti = 'oznameni-2026' | 'drivejsi-volby' | 'ruian'

export type Mistnost = {
  nazev: string
  adresa: string
  okrsky: number[]
  bezbarierova?: boolean
  poznamka?: string
  zdroj: { typ: TypZdrojeMistnosti; nazev: string; url?: string; overeno?: string }
}

type SouborMistnosti = (typeof volebniMistnosti)[number]

export const POPIS_ZDROJE: Record<TypZdrojeMistnosti, string> = {
  'oznameni-2026': 'Oznámení o době a místě konání voleb 2026',
  'drivejsi-volby': 'Údaj z dřívějších voleb — do 24. 9. 2026 se může změnit',
  ruian: 'Poznámka městské části v registru RÚIAN — není to oznámení pro rok 2026',
}

function mistnostiZeSouboru(soubor: SouborMistnosti): Mistnost[] {
  return soubor.mistnosti.map((m) => ({
    nazev: m.nazev,
    adresa: m.adresa,
    okrsky: m.okrsky,
    ...(m.bezbarierova !== undefined ? { bezbarierova: m.bezbarierova } : {}),
    ...(m.poznamka ? { poznamka: m.poznamka } : {}),
    zdroj: {
      typ: soubor.volby === 'komunalni-2026' ? 'oznameni-2026' : 'drivejsi-volby',
      nazev: soubor.zdroj.nazev,
      url: soubor.zdroj.url,
      overeno: soubor.overeno,
    },
  }))
}

/** „Volební místnost: SOU služeb, Novovysočanská 501/5" → název + adresa. */
export function mistnostZPoznamky(poznamka: string | undefined): { nazev: string; adresa: string } | undefined {
  const text = poznamka?.match(/^Volební místnost:\s*(.+)$/)?.[1]?.trim()
  if (!text) return undefined
  const carka = text.lastIndexOf(',')
  if (carka === -1) return { nazev: text, adresa: text }
  return { nazev: text.slice(0, carka).trim(), adresa: text.slice(carka + 1).trim() }
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
