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
  [/\bul\.?\s+/gi, ''],
]

function rozepisZkratky(text: string): string {
  return ZKRATKY.reduce((t, [vzor, nahrada]) => t.replace(vzor, nahrada), text)
}

/**
 * Kandidáti (ulice, číslo) z volného textu adresy. Bere první část před
 * čárkou, která obsahuje číslo domu; slova před číslem zkouší od nejdelšího
 * názvu ulice po nejkratší, protože text často začíná názvem budovy
 * („ZŠ Litvínovská 500/1" → ulice „Litvínovská").
 */
export function kandidatiAdresy(adresa: string): { ulice: string; cislo: string }[] {
  const casti = adresa.split(',').map((c) => c.trim())
  const cast = casti.find((c) => /\d+(?:\/\d+)?[a-z]?\s*$/i.test(c)) ?? casti[0] ?? ''
  const shoda = rozepisZkratky(cast).match(/^(.*?)\s*(\d+(?:\/\d+[a-z]?)?[a-z]?)\s*$/i)
  if (!shoda) return []
  const slova = shoda[1]!.split(/\s+/).filter(Boolean)
  const cislo = shoda[2]!
  const vysledek: { ulice: string; cislo: string }[] = []
  for (let od = 0; od < slova.length; od++) {
    const ulice = slova.slice(od).join(' ')
    vysledek.push({ ulice, cislo })
    // Oznámení někdy píší orientační/popisné v opačném pořadí než RÚIAN,
    // nebo mají v orientačním čísle překlep — číslo popisné je v ulici jednoznačné.
    const [a, b] = cislo.split('/')
    if (a && b) vysledek.push({ ulice, cislo: `${b}/${a}` }, { ulice, cislo: a })
  }
  return vysledek
}

/** Poloha adresy místnosti v registru městské části, nebo undefined. */
export function polohaAdresy(adresa: string, adresy: AdresyMestskeCasti): Poloha | undefined {
  for (const k of kandidatiAdresy(adresa)) {
    if (!normalizujUlici(k.ulice)) continue
    const nalezy = najdiAdresu(adresy, k.ulice, k.cislo)
    // Jen jednoznačná shoda; dvě různá čísla popisná se stejným orientačním nerozhodujeme.
    if (nalezy.length === 1) return nalezy[0]!.poloha
    if (nalezy.length > 1 && k.cislo.includes('/')) return nalezy[0]!.poloha
  }
  return undefined
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
