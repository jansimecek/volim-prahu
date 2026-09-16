import { describe, expect, it } from 'vitest'
import { JAZYKY, ceskyProtejsek, jazykoveVarianty, jeJazyk } from '../src/lib/jazyky'
import { dosad } from '../src/lib/mandatyPrehled'
import { PREKLADY } from '../src/preklady'
import { dalsiOtazka, vyhodnot } from '../src/components/TestZpusobilosti'

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
  it('míří jen na české cesty, které web má', () => {
    const ceske = new Set(['/', '/kde-volim', '/kdo-o-cem-rozhoduje', '/praha'])
    for (const zbytek of ['', '/can-i-vote', '/how-to-vote', '/what-is-decided', '/who-is-running']) {
      expect(ceske).toContain(ceskyProtejsek(zbytek))
    }
  })
})

/**
 * Vyhodnocení volebního práva podle § 4 odst. 1 zákona č. 491/2001 Sb.
 *
 * Tohle je jediné místo na webu, kde se z údajů o člověku skládá odpověď
 * „smíte / nesmíte". Spletená podmínka tady znamená, že web buď někoho
 * pošle k urně zbytečně, nebo — hůř — odradí voliče, který volit smí.
 */
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
