import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { HraniceOkrsku } from './okrsky'

/**
 * Obrysy 57 městských částí pro mapu na titulní straně, složené z hranic
 * volebních okrsků (RÚIAN) — žádný další zdroj dat.
 *
 * Postup: hrany okrsků, které sdílí dva okrsky téže části, se zruší; zbylé
 * tvoří obrys části (RÚIAN má společné hranice bod po bodu shodné, takže se
 * prstence uzavřou beze zbytku). Obrysy se pak zjednoduší topologicky: hranice
 * se rozdělí v bodech, kde se mění, které části ji sdílejí, a každý společný
 * úsek se zjednoduší jednou. Sousední části tak do sebe zapadnou bez mezer.
 */

type Bod = [number, number]

export type ObrysCasti = {
  slug: string
  /** SVG cesta v souřadnicích viewBoxu. */
  d: string
  /** Bod pro popisek — těžiště největšího prstence. */
  popisek: Bod
  /** Plocha největšího prstence v px², podle ní se rozhoduje, jestli se popisek vejde. */
  plocha: number
}

export type MapaPrahy = { sirka: number; vyska: number; casti: ObrysCasti[] }

/** Tolerance zjednodušení v metrech; mapa má zhruba 35 m na pixel. */
const TOLERANCE_M = 30
const SIRKA = 1000

const klic = (p: Bod) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`

function obrysyZOkrsku(g: HraniceOkrsku): Bod[][] {
  const pocet = new Map<string, number>()
  const body = new Map<string, Bod>()
  const hrany: [string, string][] = []
  for (const f of g.features) {
    const polygony = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    for (const polygon of polygony)
      for (const prstenec of polygon)
        for (let i = 0; i < prstenec.length - 1; i++) {
          const a = klic(prstenec[i]!)
          const b = klic(prstenec[i + 1]!)
          if (a === b) continue
          body.set(a, prstenec[i]!)
          body.set(b, prstenec[i + 1]!)
          const k = a < b ? `${a}|${b}` : `${b}|${a}`
          if (!pocet.has(k)) hrany.push([a, b])
          pocet.set(k, (pocet.get(k) ?? 0) + 1)
        }
  }
  const sousede = new Map<string, string[]>()
  for (const [a, b] of hrany) {
    if (pocet.get(a < b ? `${a}|${b}` : `${b}|${a}`) !== 1) continue
    sousede.set(a, [...(sousede.get(a) ?? []), b])
    sousede.set(b, [...(sousede.get(b) ?? []), a])
  }
  const navstiveno = new Set<string>()
  const prstence: Bod[][] = []
  for (const start of sousede.keys()) {
    if (navstiveno.has(start)) continue
    const prstenec: string[] = [start]
    navstiveno.add(start)
    let predchozi = start
    let aktualni = sousede.get(start)![0]!
    while (aktualni !== start && !navstiveno.has(aktualni)) {
      prstenec.push(aktualni)
      navstiveno.add(aktualni)
      const dalsi = sousede.get(aktualni)!.find((x) => x !== predchozi) ?? start
      predchozi = aktualni
      aktualni = dalsi
    }
    if (prstenec.length >= 3) prstence.push(prstenec.map((k) => body.get(k)!))
  }
  return prstence
}

/** Douglas–Peucker nad promítnutými body; krajní body zůstávají. */
function zjednodus(body: Bod[], tolerance: number): Bod[] {
  if (body.length <= 2) return body
  const [a, b] = [body[0]!, body[body.length - 1]!]
  let nejdal = 0
  let index = 0
  for (let i = 1; i < body.length - 1; i++) {
    const p = body[i]!
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const delka = Math.hypot(dx, dy)
    const vzdalenost =
      delka === 0 ? Math.hypot(p[0] - a[0], p[1] - a[1]) : Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / delka
    if (vzdalenost > nejdal) {
      nejdal = vzdalenost
      index = i
    }
  }
  if (nejdal <= tolerance) return [a, b]
  return [...zjednodus(body.slice(0, index + 1), tolerance).slice(0, -1), ...zjednodus(body.slice(index), tolerance)]
}

function plochaATeziste(prstenec: Bod[]): { plocha: number; teziste: Bod } {
  let a = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < prstenec.length; i++) {
    const [x0, y0] = prstenec[i]!
    const [x1, y1] = prstenec[(i + 1) % prstenec.length]!
    const k = x0 * y1 - x1 * y0
    a += k
    cx += (x0 + x1) * k
    cy += (y0 + y1) * k
  }
  a /= 2
  return { plocha: Math.abs(a), teziste: a === 0 ? prstenec[0]! : [cx / (6 * a), cy / (6 * a)] }
}

let cache: MapaPrahy | undefined

export function mapaPrahy(koren = join(process.cwd(), 'data', 'okrsky', 'hranice')): MapaPrahy {
  if (cache) return cache
  const soubory = readdirSync(koren).filter((f) => f.endsWith('.geojson'))
  const obrysy = soubory.map((f) => ({
    slug: f.replace(/\.geojson$/, ''),
    prstence: obrysyZOkrsku(JSON.parse(readFileSync(join(koren, f), 'utf8')) as HraniceOkrsku),
  }))

  // Promítnutí: rovnoběžky stejně daleko, poledníky zkrácené kosinem střední šířky.
  const vse = obrysy.flatMap((o) => o.prstence.flat())
  const [minLon, maxLon] = [Math.min(...vse.map((p) => p[0])), Math.max(...vse.map((p) => p[0]))]
  const [minLat, maxLat] = [Math.min(...vse.map((p) => p[1])), Math.max(...vse.map((p) => p[1]))]
  const kos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const metruNaStupen = 111_320
  const sirkaM = (maxLon - minLon) * kos * metruNaStupen
  const vyskaM = (maxLat - minLat) * metruNaStupen
  const meritko = SIRKA / sirkaM
  const vyska = Math.round(vyskaM * meritko)
  const promitni = (p: Bod): Bod => [(p[0] - minLon) * kos * metruNaStupen * meritko, (maxLat - p[1]) * metruNaStupen * meritko]
  const tolerance = TOLERANCE_M * meritko

  // Kdo sdílí který bod obrysu: podle toho se hranice dělí na společné úseky.
  const vlastnici = new Map<string, Set<string>>()
  for (const o of obrysy)
    for (const r of o.prstence)
      for (const p of r) {
        const k = klic(p)
        if (!vlastnici.has(k)) vlastnici.set(k, new Set())
        vlastnici.get(k)!.add(o.slug)
      }
  const podpis = (p: Bod) => [...vlastnici.get(klic(p))!].sort().join(',')
  const usekyCache = new Map<string, Bod[]>()

  const zjednodusenyUsek = (usek: Bod[]): Bod[] => {
    // Stejný úsek se u obou sousedů zjednoduší stejně: směr se sjednotí podle klíče krajních bodů.
    const otocit = klic(usek[0]!) > klic(usek[usek.length - 1]!)
    const kanonicky = otocit ? [...usek].reverse() : usek
    const k = kanonicky.map(klic).join(';')
    if (!usekyCache.has(k)) usekyCache.set(k, zjednodus(kanonicky.map(promitni), tolerance))
    const vysledek = usekyCache.get(k)!
    return otocit ? [...vysledek].reverse() : vysledek
  }

  const casti: ObrysCasti[] = obrysy.map((o) => {
    const prstence = o.prstence.map((r) => {
      const n = r.length
      const zlom = r.map((p, i) => {
        const s = podpis(p)
        return vlastnici.get(klic(p))!.size >= 3 || s !== podpis(r[(i - 1 + n) % n]!) || s !== podpis(r[(i + 1) % n]!)
      })
      let start = zlom.indexOf(true)
      if (start < 0) {
        // Prstenec bez zlomu: začne se nejmenším klíčem, ať ho soused rozdělí stejně.
        start = r.reduce((m, p, i) => (klic(p) < klic(r[m]!) ? i : m), 0)
        zlom[start] = true
      }
      const body: Bod[] = []
      let usek: Bod[] = [r[start]!]
      for (let j = 1; j <= n; j++) {
        const i = (start + j) % n
        usek.push(r[i]!)
        if (zlom[i]) {
          body.push(...zjednodusenyUsek(usek).slice(0, -1))
          usek = [r[i]!]
        }
      }
      return body
    })
    const platne = prstence.filter((r) => r.length >= 3)
    const nejvetsi = platne.map(plochaATeziste).sort((a, b) => b.plocha - a.plocha)[0]!
    const d = platne
      .map((r) => `M${r.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`)
      .join('')
    return { slug: o.slug, d, popisek: nejvetsi.teziste, plocha: nejvetsi.plocha }
  })

  cache = { sirka: SIRKA, vyska, casti }
  return cache
}
