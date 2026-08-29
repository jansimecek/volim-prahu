import { programy, strany, vyroky } from '#content'
import { celeJmeno, lidr, stranaPodleKodu } from './kandidatky'
import type { IdOkruhu } from './okruhy'

/**
 * Srovnání zásadních témat.
 *
 * Štítky u výroků a u programových slibů vznikaly nezávisle a jsou jemnější,
 * než jde srovnávat („Bydlení", „Dostupné bydlení", „Bydlení a územní rozvoj").
 * Tady je slučujeme do několika okruhů, ve kterých má smysl klást postoje
 * vedle sebe.
 *
 * Zásada zůstává stejná jako všude jinde: srovnáváme jen to, co je doložené.
 * Kdo k tématu doložený výrok nemá, není na stránce zamlčený — je uvedený
 * jako ten, u koho nic nemáme.
 */

export type Okruh = {
  id: IdOkruhu
  nazev: string
  popis: string
  /** Štítky z výroků a z programů, které do okruhu spadají. */
  stitky: string[]
}

export const OKRUHY: Okruh[] = [
  {
    id: 'bydleni',
    nazev: 'Bydlení',
    popis:
      'Kolik má město bytů, jestli jich má mít víc a jak je získat. Nejčastější téma pražské kampaně a zároveň to, kde se nejvíc pletou pravomoci města s prací investorů.',
    stitky: [
      'Bydlení',
      'Dostupné bydlení',
      'Bydlení a krátkodobé pronájmy',
      'Bydlení a územní rozvoj',
      'Bydlení a veřejný prostor',
      'Bydlení a územní plán',
      'Bydlení, investice a doprava',
    ],
  },
  {
    id: 'doprava',
    nazev: 'Doprava a MHD',
    popis:
      'Cena jízdného, parkování, velké dopravní stavby. Rozsah městské hromadné dopravy schvaluje magistrát, městská část do něj nemluví.',
    stitky: [
      'Doprava a MHD',
      'Doprava a parkování',
      'Doprava a veřejný prostor',
      'Doprava a investice',
    ],
  },
  {
    id: 'uzemni-plan',
    nazev: 'Územní plán a rozvoj',
    popis:
      'Co se kde smí stavět. Územně plánovací dokumentaci vydává Zastupitelstvo hl. m. Prahy — je to nástroj, který město skutečně drží.',
    stitky: ['Územní plán'],
  },
  {
    id: 'rozpocet',
    nazev: 'Rozpočet a městské firmy',
    popis:
      'Hospodaření města, investice a řízení podniků, které město vlastní. Rozhodování o majetkové účasti nad 25 milionů je vyhrazeno zastupitelstvu.',
    stitky: ['Rozpočet a investice', 'Městské firmy', 'Odměňování'],
  },
  {
    id: 'skolstvi',
    nazev: 'Školství',
    popis:
      'Základní a mateřské školy zřizují městské části, střední školy kraj — tedy magistrát. Tenhle rozdíl programy obvykle nezmiňují.',
    stitky: ['Školství'],
  },
  {
    id: 'prostredi',
    nazev: 'Životní prostředí a odpady',
    popis:
      'Odpady, voda, zeleň. Systém nakládání s odpadem stanoví Praha vyhláškou, provoz řeší městské části.',
    stitky: ['Odpady', 'Energie a voda'],
  },
  {
    id: 'socialni',
    nazev: 'Sociální a zdravotní služby',
    popis: 'Sociální centra, péče o seniory, dostupnost zdravotní péče.',
    stitky: ['Sociální a zdravotní služby'],
  },
]

export type VyrokVOkruhu = {
  osobaSlug: string
  jmeno: string
  subjekt: string
  zkratkaStrany: string
  tema: string
  citace: string
  pokracovani?: string
  kontext: string
  zdroj: string
  poznamka?: string
}

export type SlibVOkruhu = {
  subjekt: string
  zkratkaStrany: string
  slib: string
  zaver: string
  oblast: string
}

export function vyrokyOkruhu(okruh: Okruh): VyrokVOkruhu[] {
  const stitky = new Set(okruh.stitky)
  return vyroky.osoby.flatMap((o) =>
    o.vyroky
      .filter((v) => stitky.has(v.tema))
      .map((v) => ({
        osobaSlug: o.osobaSlug,
        jmeno: o.jmeno,
        subjekt: o.subjekt,
        zkratkaStrany: strany.find((s) => s.slug === o.subjekt)?.zkratka ?? o.subjekt,
        ...v,
      })),
  )
}

export function slibyOkruhu(okruh: Okruh): SlibVOkruhu[] {
  const stitky = new Set(okruh.stitky)
  return programy.flatMap((p) =>
    p.body
      .filter((b) => b.hodnoceni && b.oblast && stitky.has(b.oblast))
      .map((b) => ({
        subjekt: p.subjekt,
        zkratkaStrany: strany.find((s) => s.slug === p.subjekt)?.zkratka ?? p.subjekt,
        slib: b.slib,
        zaver: b.hodnoceni!.zaver,
        oblast: b.oblast!,
      })),
  )
}

/** Lídři, u kterých k okruhu nic doloženého nemáme. Mlčení musí být vidět. */
export function bezVyroku(okruh: Okruh): { jmeno: string; subjekt: string; zkratka: string }[] {
  const maji = new Set(vyrokyOkruhu(okruh).map((v) => v.osobaSlug))
  return strany
    .filter((s) => s.uroven === 'magistrat')
    .map((s) => {
      const jednicka = lidr(stranaPodleKodu('magistrat', s.kodStrany))
      return jednicka
        ? { jmeno: celeJmeno(jednicka), subjekt: s.slug, zkratka: s.zkratka, slug: jednicka.slug }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .filter((x) => !maji.has(x.slug))
    .map(({ jmeno, subjekt, zkratka }) => ({ jmeno, subjekt, zkratka }))
}
