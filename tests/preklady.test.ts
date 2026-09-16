import { describe, expect, it } from 'vitest'
import {
  JAZYKY,
  PODSTRANKY,
  ceskyProtejsek,
  cizojazycnyProtejsek,
  jazykoveVarianty,
  jeJazyk,
} from '../src/lib/jazyky'
import { dosad } from '../src/lib/sablony'
import { PREKLADY } from '../src/preklady'
import { dalsiOtazka, vyhodnot } from '../src/components/TestZpusobilosti'
import { popisVzdalenosti } from '../src/components/VyhledavacOkrsku'
import { VYHLEDAVAC_CESKY } from '../src/preklady/vyhledavacCesky'

/**
 * Překlad je obsah, ne řetězce v kódu — a platí pro něj stejné pravidlo
 * jako pro zbytek webu: co nejde doložit, nesmí projít buildem.
 *
 * Typ `Preklad` hlídá, že ukrajinská verze má všechny klíče anglické.
 * Co typ neuhlídá, je délka seznamů (tři způsoby hlasování v jednom
 * jazyce a dva v druhém projdou) a prázdné řetězce (`''` je platný
 * `string`). To dělají testy tady.
 */

type Uzel = unknown

function projdi(uzel: Uzel, cesta: string, navstiv: (cesta: string, hodnota: Uzel) => void) {
  navstiv(cesta, uzel)
  if (Array.isArray(uzel)) {
    uzel.forEach((polozka, i) => projdi(polozka, `${cesta}[${i}]`, navstiv))
  } else if (uzel && typeof uzel === 'object') {
    for (const [klic, hodnota] of Object.entries(uzel)) {
      projdi(hodnota, `${cesta}.${klic}`, navstiv)
    }
  }
}

/** Tvar hodnoty: objekt, pole dané délky, nebo prostý typ. */
function tvar(uzel: Uzel): string {
  if (Array.isArray(uzel)) return `pole(${uzel.length})`
  if (uzel && typeof uzel === 'object') return `objekt(${Object.keys(uzel).sort().join(',')})`
  return typeof uzel
}

describe('jazykové verze', () => {
  it('jsou obě k dispozici', () => {
    expect(Object.keys(PREKLADY).sort()).toEqual([...JAZYKY].sort())
  })

  it('mají shodnou strukturu včetně délky seznamů', () => {
    const [prvni, ...zbytek] = JAZYKY
    const referencni = new Map<string, string>()
    projdi(PREKLADY[prvni], '', (cesta, hodnota) => referencni.set(cesta, tvar(hodnota)))

    for (const jazyk of zbytek) {
      const rozdily: string[] = []
      projdi(PREKLADY[jazyk], '', (cesta, hodnota) => {
        const ocekavano = referencni.get(cesta)
        const skutecnost = tvar(hodnota)
        if (ocekavano !== skutecnost) {
          rozdily.push(`${cesta}: ${prvni}=${ocekavano} ${jazyk}=${skutecnost}`)
        }
      })
      expect(rozdily, `struktura ${jazyk} se rozešla s ${prvni}`).toEqual([])
    }
  })

  it('nemají prázdný ani nepřeložený text', () => {
    for (const jazyk of JAZYKY) {
      const prazdne: string[] = []
      projdi(PREKLADY[jazyk], '', (cesta, hodnota) => {
        if (typeof hodnota === 'string' && hodnota.trim() === '') prazdne.push(cesta)
      })
      expect(prazdne, `prázdné řetězce v ${jazyk}`).toEqual([])
    }
  })

  it('mají jazykový kód shodný s klíčem', () => {
    for (const jazyk of JAZYKY) expect(PREKLADY[jazyk].htmlLang).toBe(jazyk)
  })

  /**
   * Zástupné značky se dosazují za běhu. Kdyby se v jednom jazyce
   * přejmenovaly nebo vypadly, projde to typem i strukturou — a na stránce
   * pak stojí „{magistrat} mandátů" nebo věta bez čísla.
   */
  it('používají v obou jazycích tytéž zástupné značky', () => {
    const znacky = (s: string) =>
      [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort()
    const podle = new Map<string, string[]>()
    for (const jazyk of JAZYKY) {
      projdi(PREKLADY[jazyk], '', (cesta, hodnota) => {
        if (typeof hodnota !== 'string') return
        const nalezene = znacky(hodnota)
        const drive = podle.get(cesta)
        if (drive === undefined) podle.set(cesta, nalezene)
        else expect(nalezene, `zástupné značky v ${cesta} (${jazyk})`).toEqual(drive)
      })
    }
  })

  it('dosazují známé značky a neznámé nechávají být', () => {
    expect(dosad('{a} z {b}', { a: 65, b: 57 })).toBe('65 z 57')
    expect(dosad('{a} a {neznama}', { a: 1 })).toBe('1 a {neznama}')
  })
})

describe('rozpoznání jazyka v adrese', () => {
  it('bere jen podporované kódy', () => {
    expect(jeJazyk('en')).toBe(true)
    expect(jeJazyk('uk')).toBe(true)
    expect(jeJazyk('cs')).toBe(false)
    expect(jeJazyk('de')).toBe(false)
  })
})

describe('hreflang', () => {
  it('nabízí všechny jazyky i český protějšek', () => {
    const mapa = jazykoveVarianty('/en/can-i-vote')
    expect(mapa.en).toBe('/en/can-i-vote')
    expect(mapa.uk).toBe('/uk/can-i-vote')
    expect(mapa.cs).toBe('/kde-volim')
    expect(mapa['x-default']).toBe('/kde-volim')
  })

  it('u rozcestníku míří do češtiny na titulní stranu', () => {
    expect(jazykoveVarianty('/uk').cs).toBe('/')
  })

  /**
   * Odkaz z cizojazyčné stránky musí vést na existující českou stránku.
   * Kdyby se česká stránka přejmenovala, ukáže to tenhle test dřív než
   * čtenář, který se z ukrajinské verze proklikne na 404.
   */
  /**
   * Dvojice musí platit oběma směry. Kdyby přepínač vedl z `/kde-volim`
   * jinam, než kam ukazuje hreflang, poslal by čtenáře na stránku, kterou
   * vyhledávač za překlad nepovažuje.
   */
  it('doslovné dvojice si odpovídají oběma směry', () => {
    for (const cesky of ['/kde-volim', '/kdo-o-cem-rozhoduje', '/praha']) {
      const podstranka = cizojazycnyProtejsek(cesky)
      expect(podstranka, `${cesky} nemá protějšek`).not.toBeNull()
      expect(PODSTRANKY).toContain(podstranka)
      expect(ceskyProtejsek(`/${podstranka}`)).toBe(cesky)
    }
  })

  it('stránka bez doslovného protějšku posílá na rozcestník jazyka', () => {
    expect(cizojazycnyProtejsek('/')).toBeNull()
    expect(cizojazycnyProtejsek('/temata')).toBeNull()
  })

  it('míří jen na české cesty, které web má', () => {
    const ceske = new Set(['/', '/kde-volim', '/kdo-o-cem-rozhoduje', '/praha'])
    for (const p of PODSTRANKY) expect(ceske).toContain(ceskyProtejsek(`/${p}`))
    expect(ceske).toContain(ceskyProtejsek(''))
  })
})

/**
 * Vyhodnocení volebního práva podle § 4 odst. 1 zákona č. 491/2001 Sb.
 *
 * Tohle je jediné místo na webu, kde se z údajů o člověku skládá odpověď
 * „smíte / nesmíte". Spletená podmínka tady znamená, že web buď někoho
 * pošle k urně zbytečně, nebo — hůř — odradí voliče, který volit smí.
 */
/**
 * Vyhledávač okrsku je jediná komponenta, kterou sdílí česká a cizojazyčná
 * verze. Čeština v něm proto není výchozí zadrátovaný text, ale slovník
 * stejného tvaru jako překlady — a musí projít stejnými kontrolami, jinak
 * by se dalo přidat pole do angličtiny a nechat český web s `undefined`.
 */
describe('vyhledávač okrsku ve všech jazycích', () => {
  const vsechny = { cs: VYHLEDAVAC_CESKY, ...Object.fromEntries(JAZYKY.map((j) => [j, PREKLADY[j].vyhledavac])) }

  it('má českou variantu ve stejném tvaru jako překlady', () => {
    const referencni = new Map<string, string>()
    projdi(PREKLADY.en.vyhledavac, '', (cesta, hodnota) => referencni.set(cesta, tvar(hodnota)))

    for (const [jazyk, texty] of Object.entries(vsechny)) {
      const rozdily: string[] = []
      projdi(texty, '', (cesta, hodnota) => {
        if (referencni.get(cesta) !== tvar(hodnota)) rozdily.push(cesta)
      })
      expect(rozdily, `tvar vyhledávače v ${jazyk}`).toEqual([])
    }
  })

  it('zná popis u všech typů zdroje volební místnosti', () => {
    // Kdyby přibyl typ zdroje a některý jazyk ho neměl, spadl by výsledek
    // vyhledávání na `undefined` místo vysvětlení, odkud adresa je.
    for (const [jazyk, texty] of Object.entries(vsechny)) {
      for (const typ of ['oznameni-2026', 'drivejsi-volby', 'ruian'] as const) {
        expect(texty.zdrojeMistnosti[typ], `${typ} v ${jazyk}`).toBeTruthy()
      }
    }
  })

  it('popisuje vzdálenost v jazyce stránky a nezaokrouhluje na metry', () => {
    const en = PREKLADY.en.vyhledavac
    expect(popisVzdalenosti(20, en, 'en-GB')).toBe(en.naAdrese)
    expect(popisVzdalenosti(430, en, 'en-GB')).toContain('450 m')
    expect(popisVzdalenosti(1340, en, 'en-GB')).toContain('1.3 km')

    const cs = VYHLEDAVAC_CESKY
    expect(popisVzdalenosti(1340, cs, 'cs-CZ')).toContain('1,3 km')
    expect(popisVzdalenosti(430, cs, 'cs-CZ')).toBe('Vzdušnou čarou asi 450 m od vaší adresy.')
  })

  it('nenechá v hláškách nedosazenou značku', () => {
    for (const [jazyk, texty] of Object.entries(vsechny)) {
      const hotove = [
        dosad(texty.uliceNenalezena, { ulice: 'X' }),
        dosad(texty.cisloNenalezeno, { ulice: 'X', casti: 'Y', cislo: '1' }),
        dosad(texty.viceAdres, { pocet: 2 }),
        dosad(texty.uredniDeska, { mc: 'Praha 7' }),
        dosad(texty.kdoKandiduje, { mc: 'Praha 7' }),
        dosad(texty.registrAdres, { datum: '1. 1. 2026' }),
        dosad(texty.vicekrat, { pocet: 3 }),
        dosad(texty.mapa.popisek, { okrsek: 1 }),
        dosad(texty.mapa.legenda, { okrsek: 1 }),
      ]
      for (const text of hotove) expect(text, jazyk).not.toMatch(/\{\w+\}/)
    }
  })
})

describe('test volební způsobilosti', () => {
  it('občan ČR s pražským pobytem a plnoletostí volí', () => {
    expect(vyhodnot('cz', 'ano', 'ano')).toBe('czPlny')
  })

  it('občan EU s pražským pobytem a plnoletostí volí', () => {
    expect(vyhodnot('eu', 'ano', 'ano')).toBe('euPlny')
  })

  it('občanství mimo EU vylučuje volební právo bez ohledu na pobyt a věk', () => {
    for (const pobyt of ['ano', 'jinde', 'ne'] as const) {
      for (const vek of ['ano', 'ne'] as const) {
        expect(vyhodnot('mimo', pobyt, vek)).toBe('mimoEu')
      }
    }
    // A nesmí se ptát dál — odpověď je už tady úplná.
    expect(dalsiOtazka('mimo', null)).toBeNull()
  })

  it('pobyt mimo Prahu posílá do vlastní obce, ne pryč', () => {
    expect(vyhodnot('cz', 'jinde', null)).toBe('jinaObec')
    expect(vyhodnot('eu', 'jinde', null)).toBe('jinaObec')
  })

  it('bez přihlášeného pobytu se v komunálních volbách nevolí', () => {
    expect(vyhodnot('cz', 'ne', null)).toBe('bezPobytu')
    expect(vyhodnot('eu', 'ne', null)).toBe('bezPobytu')
  })

  it('nezletilost vylučuje až po ověření pobytu', () => {
    expect(vyhodnot('cz', 'ano', 'ne')).toBe('mlady')
    expect(vyhodnot('eu', 'ano', 'ne')).toBe('mlady')
  })

  it('bez odpovědi nevydá závěr', () => {
    expect(vyhodnot('cz', null, null)).toBeNull()
    expect(vyhodnot('eu', 'ano', null)).toBeNull()
  })

  it('ptá se na věk jen tam, kde na něm ještě záleží', () => {
    expect(dalsiOtazka(null, null)).toBe('obcanstvi')
    expect(dalsiOtazka('cz', null)).toBe('pobyt')
    expect(dalsiOtazka('cz', 'ano')).toBe('vek')
    expect(dalsiOtazka('cz', 'jinde')).toBeNull()
    expect(dalsiOtazka('cz', 'ne')).toBeNull()
  })

  it('každý závěr má text v obou jazycích', () => {
    const zavery = ['czPlny', 'euPlny', 'jinaObec', 'bezPobytu', 'mimoEu', 'mlady'] as const
    for (const jazyk of JAZYKY) {
      for (const zaver of zavery) {
        const v = PREKLADY[jazyk].canIVote.testVysledky[zaver]
        expect(v, `${zaver} chybí v ${jazyk}`).toBeDefined()
        expect(v.nadpis.length).toBeGreaterThan(0)
        expect(v.text.length).toBeGreaterThan(0)
      }
    }
  })

  /**
   * Odpověď „ano" smí padnout jen tam, kde ji zákon dává. Kdyby někdo
   * přehodil stav u výsledku pro občanství mimo EU, ukáže to tenhle test.
   */
  it('kladný závěr dávají jen případy, kterým ho zákon přiznává', () => {
    for (const jazyk of JAZYKY) {
      const v = PREKLADY[jazyk].canIVote.testVysledky
      expect(v.czPlny.stav).toBe('ano')
      expect(v.euPlny.stav).toBe('ano')
      expect(v.mimoEu.stav).toBe('ne')
      expect(v.bezPobytu.stav).toBe('ne')
      expect(v.mlady.stav).toBe('ne')
      expect(v.jinaObec.stav).toBe('jinde')
    }
  })
})
