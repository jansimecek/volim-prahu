/**
 * Poloha volební místnosti z její adresy — bez cizího geokodéru, jen nad
 * vlastními adresními místy ČÚZK. Adresa z oznámení („ZŠ Litvínovská 500/1",
 * „Strossmayerovo nám. 990/4, Praha 7") se rozloží na ulici a číslo a hledá
 * se v registru dané městské části. Když se nenajde, místnost zůstane bez
 * polohy a mapa ji prostě nekreslí — hádat by bylo horší.
 */
import { najdiAdresu, normalizujUlici, type AdresyMestskeCasti } from './okrskyHledani'

export type Poloha = { lat: number; lon: number }

const ZKRATKY: [RegExp, string][] = [
  [/\bnám\.?(?=\s|$)/gi, 'náměstí'],
  [/\bnábř\.?(?=\s|$)/gi, 'nábřeží'],
  [/\bbří(?=\s)/gi, 'bratří'],
  [/\bul\.?\s+/gi, ''],
]

/** „Vachkova č.p. 630" — zdroj výslovně říká, že jde o číslo popisné. Bez \b: hranice slova v JS nefunguje před „č". */
const VZOR_CP = /(^|\s)č\.?\s*p\.?\s*(?=\d)/gi

function rozepisZkratky(text: string): string {
  return ZKRATKY.reduce((t, [vzor, nahrada]) => t.replace(vzor, nahrada), text)
}

/**
 * Kandidáti (ulice, číslo) z volného textu adresy. Bere první část před
 * čárkou, která obsahuje číslo domu; slova před číslem zkouší od nejdelšího
 * názvu ulice po nejkratší, protože text často začíná názvem budovy
 * („ZŠ Litvínovská 500/1" → ulice „Litvínovská").
 */
export type KandidatAdresy = { ulice: string; cislo: string; jenPopisne?: true }

export function kandidatiAdresy(adresa: string): KandidatAdresy[] {
  const casti = adresa.split(',').map((c) => c.trim())
  const surova = casti.find((c) => /\d+\s?[a-z]?(?:\/\d+\s?[a-z]?)?\s*$/i.test(c)) ?? casti[0] ?? ''
  const jenPopisne = VZOR_CP.test(surova) ? ({ jenPopisne: true } as const) : {}
  VZOR_CP.lastIndex = 0
  const cast = surova.replace(VZOR_CP, '$1')
  const vysledek: KandidatAdresy[] = []
  // Registr má některé názvy sám zkrácené („Veronské nám."), proto se zkouší
  // rozepsaná i původní podoba — nejdřív rozepsaná, ta je v RÚIAN běžnější.
  for (const varianta of [...new Set([rozepisZkratky(cast), cast])]) {
    const shoda = varianta.match(/^(.*?)\s*(\d+\s?[a-z]?(?:\/\d+\s?[a-z]?)?)\s*$/i)
    if (!shoda) continue
    const slova = shoda[1]!.split(/\s+/).filter(Boolean)
    // „235/1 a" → „235/1a": písmeno orientačního čísla se v oznámeních píše i s mezerou.
    const cislo = shoda[2]!.replace(/\s+/g, '').toLowerCase()
    for (let od = 0; od < slova.length; od++) {
      const ulice = slova.slice(od).join(' ')
      vysledek.push({ ulice, cislo, ...jenPopisne })
      // Oznámení někdy píší orientační/popisné v opačném pořadí než RÚIAN,
      // nebo mají v orientačním čísle překlep — číslo popisné je v ulici jednoznačné.
      const [a, b] = cislo.split('/')
      if (a && b) vysledek.push({ ulice, cislo: `${b}/${a}` }, { ulice, cislo: a, jenPopisne: true })
    }
  }
  return vysledek
}

/**
 * Zkrácený název ulice z oznámení („U Roháč. kasáren") → plný název z registru.
 * Slovo s tečkou se bere jako prefix; shoda musí být jediná.
 */
function rozepisUlici(ulice: string, adresy: AdresyMestskeCasti): string {
  const slova = ulice.split(/\s+/).filter(Boolean)
  if (!slova.some((w) => w.endsWith('.'))) return ulice
  const vzor = slova.map((w) => ({ zkratka: w.endsWith('.'), text: normalizujUlici(w) }))
  const shody = Object.keys(adresy.ulice).filter((nazev) => {
    const casti = normalizujUlici(nazev).split(' ')
    if (casti.length !== vzor.length) return false
    return vzor.every((v, i) => (v.zkratka ? casti[i]!.startsWith(v.text) : casti[i] === v.text))
  })
  return shody.length === 1 ? shody[0]! : ulice
}

/**
 * Poloha adresy místnosti v registru městské části, nebo undefined.
 *
 * Nejednoznačnost se řeší jen dvěma bezpečnými pravidly: všechny shody mají
 * totéž číslo popisné (jeden dům, víc vchodů), nebo právě jedna shoda leží
 * v některém z okrsků, které v místnosti volí — místnost bývá uvnitř svého
 * okrsku. Jinak se nevrací nic.
 */
export function polohaAdresy(adresa: string, adresy: AdresyMestskeCasti, okrsky: number[] = []): Poloha | undefined {
  for (const k of kandidatiAdresy(adresa)) {
    const ulice = rozepisUlici(k.ulice, adresy)
    if (!normalizujUlici(ulice)) continue
    const vsechny = najdiAdresu(adresy, ulice, k.cislo)
    const nalezy = k.jenPopisne ? vsechny.filter((n) => n.cislo.split('/')[0] === k.cislo) : vsechny
    if (nalezy.length === 1) return nalezy[0]!.poloha
    if (nalezy.length > 1) {
      const popisna = new Set(nalezy.map((n) => n.cislo.split('/')[0]))
      if (popisna.size === 1) return nalezy[0]!.poloha
      const vOkrsku = nalezy.filter((n) => okrsky.includes(n.okrsek))
      if (vOkrsku.length === 1) return vOkrsku[0]!.poloha
    }
  }
  return undefined
}

/**
 * Totéž přes celou Prahu — škola s místností stojí občas těsně za hranicí
 * městské části (ZŠ Křesomyslova volí pro Prahu 2, leží v Praze 4). Vlastní
 * část má přednost; jinde se bere jen shoda v jediné části.
 */
export function polohaAdresyVPraze(
  adresa: string,
  vlastni: AdresyMestskeCasti,
  ostatni: AdresyMestskeCasti[],
  okrsky: number[] = [],
): Poloha | undefined {
  const doma = polohaAdresy(adresa, vlastni, okrsky)
  if (doma) return doma
  const jinde = ostatni.map((a) => polohaAdresy(adresa, a)).filter((p): p is Poloha => p !== undefined)
  return jinde.length === 1 ? jinde[0] : undefined
}

/** Vzdálenost vzdušnou čarou v metrech (haversine). */
export function vzdalenostMetru(a: Poloha, b: Poloha): number {
  const r = 6371000
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(h))
}
