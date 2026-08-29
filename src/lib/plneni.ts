import type { plneni } from '#content'

/**
 * Popisy stavů plnění závazku. Sdílené infografikou i výpisem, aby se
 * nemohly rozejít — dvě různá slova pro tentýž stav jsou horší než žádná.
 */

export type StavPlneni = (typeof plneni.zavazky)[number]['stav']

/**
 * Pořadí od nejlepšího doloženého výsledku po chybějící doklad.
 *
 * `bez-dokladu` je poslední schválně, ale NENÍ to nejhorší stav — znamená
 * „nedohledali jsme výsledek", ne „nesplnili". Zaměnit to znamená obvinit
 * konkrétní lidi z něčeho, co jsme neprokázali.
 */
export const POradiSTAVU: StavPlneni[] = ['splneno', 'castecne', 'nesplneno', 'bez-dokladu']

export const POPIS_STAVU: Record<
  StavPlneni,
  { nazev: string; trida: string; pruh: string; znacka: string }
> = {
  splneno: {
    nazev: 'Doloženo jako splněné',
    trida: 'plneni-splneno',
    pruh: 'plneni-pruh-splneno',
    znacka: '●',
  },
  castecne: {
    nazev: 'Doloženo částečně',
    trida: 'plneni-castecne',
    pruh: 'plneni-pruh-castecne',
    znacka: '◐',
  },
  nesplneno: {
    nazev: 'Doloženo jako nesplněné',
    trida: 'plneni-nesplneno',
    pruh: 'plneni-pruh-nesplneno',
    znacka: '○',
  },
  'bez-dokladu': {
    nazev: 'Výsledek nedohledán',
    trida: 'plneni-bez-dokladu',
    pruh: 'plneni-pruh-bez-dokladu',
    znacka: '–',
  },
}

export const POPIS_KATEGORIE = {
  'v-realizaci': 'V realizaci',
  pripravovane: 'Připravované',
  vyhled: 'Výhled',
} as const
