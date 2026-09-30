import { postoje, programy, sporneOtazky, strany, vyroky } from '#content'
import { celeJmeno, lidr, stranaPodleKodu } from './kandidatky'
import type { Cas, Kompetence, Rozpocet } from './hodnoceni'
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
      'Bydlení a investice',
    ],
  },
  {
    id: 'doprava',
    nazev: 'Doprava a MHD',
    popis:
      'Cena jízdného, parkování, velké dopravní stavby. Rozsah městské hromadné dopravy schvaluje magistrát, městská část do něj nemluví.',
    stitky: [
      'Doprava',
      'Doprava a MHD',
      'Doprava a parkování',
      'Doprava a cyklistika',
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
    nazev: 'Životní prostředí a energetika',
    popis:
      'Odpady, voda, zeleň a energie. Systém nakládání s odpadem stanoví Praha vyhláškou, provoz řeší městské části. U energetiky jde hlavně o střechy a budovy, které město vlastní.',
    stitky: ['Odpady', 'Energie a voda', 'Energetika'],
  },
  {
    id: 'socialni',
    nazev: 'Sociální služby, zdraví a bezpečnost',
    popis:
      'Sociální centra, péče o seniory, dostupnost zdravotní péče a městská policie, kterou zřizuje magistrát. Státní policii ani prodej alkoholu město neřídí.',
    stitky: ['Sociální a zdravotní služby', 'Bezpečnost'],
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

export type PostojVOkruhu = {
  subjekt: string
  zkratkaStrany: string
  shrnuti: string
  postoj: string
  typZdroje: 'program' | 'vyrok' | 'hlasovani' | 'odvozeni'
  zdroj?: { text: string; url: string; datum: string }
  poznamka?: string
  proveditelnost?: { agenda?: string; kompetence: Kompetence; rozpocet: Rozpocet; cas: Cas }
}

/**
 * Zapsané postoje subjektů k okruhu.
 *
 * Na rozdíl od výroků se tu nesrovnávají lidé, ale subjekty — a na rozdíl od
 * slibů to není naše hodnocení, jen zápis toho, co subjekt říká. Typ zdroje
 * jde ven spolu s postojem vždycky; bez něj vypadá odvození stejně jako
 * programový závazek.
 */
export function postojeOkruhu(okruh: Okruh): PostojVOkruhu[] {
  return postoje
    .filter((z) => z.uroven === 'magistrat')
    .flatMap((z) =>
      z.postoje
        .filter((p) => p.okruh === okruh.id)
        .map((p) => ({
          subjekt: z.subjekt,
          zkratkaStrany: strany.find((s) => s.slug === z.subjekt)?.zkratka ?? z.subjekt,
          shrnuti: p.shrnuti,
          postoj: p.postoj,
          typZdroje: p.typZdroje,
          zdroj: p.zdroj,
          poznamka: p.poznamka,
          proveditelnost: p.proveditelnost,
        })),
    )
    .sort((a, b) => a.zkratkaStrany.localeCompare(b.zkratkaStrany, 'cs'))
}

/** Subjekty, u kterých k okruhu žádný zapsaný postoj nemáme. */
export function bezPostoje(okruh: Okruh): { subjekt: string; zkratka: string }[] {
  const maji = new Set(postojeOkruhu(okruh).map((p) => p.subjekt))
  return strany
    .filter((s) => s.uroven === 'magistrat' && !maji.has(s.slug))
    .map((s) => ({ subjekt: s.slug, zkratka: s.zkratka }))
    .sort((a, b) => a.zkratka.localeCompare(b.zkratka, 'cs'))
}

export type SubjektSrovnani = { subjekt: string; zkratka: string }

/**
 * Subjekty, které mají aspoň jeden zapsaný postoj — tedy ty, o kterých ve
 * srovnání vůbec něco víme. Tvoří sloupce přehledu sporných otázek; kdo
 * nemá postoj k ničemu, by měl v přehledu jen prázdná pole.
 */
export function subjektySrovnani(): SubjektSrovnani[] {
  const maji = new Set(postoje.filter((z) => z.uroven === 'magistrat').map((z) => z.subjekt))
  return strany
    .filter((s) => s.uroven === 'magistrat' && maji.has(s.slug))
    .map((s) => ({ subjekt: s.slug, zkratka: s.zkratka }))
    .sort((a, b) => a.zkratka.localeCompare(b.zkratka, 'cs'))
}

export type SpornaOtazka = (typeof sporneOtazky.otazky)[number]

export type OdpovedNaOtazku = SpornaOtazka['odpovedi'][number] & { zkratka: string }

/**
 * Sporná otázka rozložená na škálu: ke každé možnosti subjekty, které do ní
 * patří, a zvlášť ti, o kterých nic nevíme.
 *
 * Nedoložení se počítají proti subjektům srovnání, ne proti všem
 * kandidujícím — jinak by u každé otázky viselo patnáct jmen stran, o kterých
 * nemáme zapsané vůbec nic, a skutečné mezery by v nich zanikly.
 */
export function skalaOtazky(otazka: SpornaOtazka) {
  const zkratka = (slug: string) => strany.find((s) => s.slug === slug)?.zkratka ?? slug
  const odpovedi: OdpovedNaOtazku[] = otazka.odpovedi.map((o) => ({ ...o, zkratka: zkratka(o.subjekt) }))
  const zarazeni = new Set(odpovedi.map((o) => o.subjekt))
  return {
    moznosti: otazka.moznosti.map((m, poradi) => ({
      ...m,
      poradi,
      odpovedi: odpovedi
        .filter((o) => o.moznost === m.id)
        .sort((a, b) => a.zkratka.localeCompare(b.zkratka, 'cs')),
    })),
    nedolozeno: subjektySrovnani().filter((s) => !zarazeni.has(s.subjekt)),
  }
}

export function otazkyOkruhu(okruh: Okruh): SpornaOtazka[] {
  return sporneOtazky.otazky.filter((o) => o.okruh === okruh.id)
}

export function vsechnyOtazky(): SpornaOtazka[] {
  // Pořadí přehledu sleduje pořadí okruhů na stránce, ne pořadí v souboru.
  const poradi = new Map(OKRUHY.map((o, i) => [o.id, i]))
  return [...sporneOtazky.otazky].sort(
    (a, b) => (poradi.get(a.okruh) ?? 0) - (poradi.get(b.okruh) ?? 0),
  )
}

export const OVERENO_SPORNE = sporneOtazky.overeno
