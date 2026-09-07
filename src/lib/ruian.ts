/**
 * Čtení dat ČÚZK o volebních okrscích. Čisté funkce bez I/O, aby šly testovat
 * na malých ukázkách; stahování a zápis dělá `scripts/import-okrsky.ts`.
 *
 * Dva zdroje:
 *
 *  1. Sestava „Seznam adresních míst s volebními okrsky"
 *     (services.cuzk.cz/sestavy/VO/<kód MOMC>.zip). CSV, středník, Windows-1250,
 *     jeden řádek na adresní místo, poslední sloupec je číslo okrsku ve tvaru
 *     „7001,0". Praha jako obec vlastní soubor nemá — existuje jen 57 souborů
 *     per městská část (MOMC), a kód MOMC je totožný s kódem zastupitelstva
 *     v číselníku ČSÚ.
 *
 *  2. Speciální výměnný formát ST_UVOH (vdp.cuzk.cz/vymenny_format/specialni/
 *     <YYYYMMDD>_ST_UVOH.xml.zip). GML se všemi okrsky v ČR, s definičním
 *     bodem, hranicí (MultiSurface) a občas poznámkou. Vzniká ke 3. dni v měsíci.
 *
 * Souřadnice v obou jsou S-JTSK. V CSV jsou kladné hodnoty JTSK, v GML už
 * EPSG:5514 se zápornými — viz `krovak.ts`.
 */
import { sjtskNaWgs84, zaokrouhli, type Wgs84 } from './krovak'

export type AdresniMisto = {
  /** Kód adresního místa v RÚIAN. */
  adm: number
  kodMomc: string
  /** Název ulice; kde ulice není, název části obce (Hradčany, Malá Strana…). */
  ulice: string
  castObce: string
  typ: 'č.p.' | 'č.ev.'
  cisloDomovni: number
  /** Včetně písmene, např. „23a". Prázdné, když orientační číslo není. */
  cisloOrientacni: string
  psc: string
  okrsek: number | null
  poloha: Wgs84 | null
}

const SLOUPCE_POVINNE = ['Kód ADM', 'Kód MOMC', 'Název ulice', 'Číslo volebního okrsku']

export function dekodujCp1250(data: Uint8Array): string {
  return new TextDecoder('windows-1250').decode(data)
}

/** „7001,0" → 7001. Prázdná hodnota znamená, že RÚIAN adresu k okrsku nepřiřadil. */
export function cisloOkrsku(hodnota: string): number | null {
  const cele = hodnota.trim().split(',')[0] ?? ''
  if (!/^\d+$/.test(cele)) return null
  return Number(cele)
}

function cisloJtsk(hodnota: string): number | null {
  if (!hodnota.trim()) return null
  const n = Number(hodnota.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function parseSestavuVO(text: string): AdresniMisto[] {
  const radky = text.split(/\r?\n/).filter((r) => r.trim() !== '')
  const hlavicka = (radky.shift() ?? '').replace(/^﻿/, '').split(';')
  for (const sloupec of SLOUPCE_POVINNE) {
    if (!hlavicka.includes(sloupec)) {
      throw new Error(`Sestava VO nemá sloupec „${sloupec}" — změnil ČÚZK formát?`)
    }
  }
  const idx = (nazev: string) => hlavicka.indexOf(nazev)
  const iAdm = idx('Kód ADM')
  const iMomc = idx('Kód MOMC')
  const iCast = idx('Název části obce')
  const iUlice = idx('Název ulice')
  const iTyp = idx('Typ SO')
  const iCp = idx('Číslo domovní')
  const iCo = idx('Číslo orientační')
  const iZnak = idx('Znak čísla orientačního')
  const iPsc = idx('PSČ')
  const iX = idx('Souřadnice X')
  const iY = idx('Souřadnice Y')
  const iOkrsek = idx('Číslo volebního okrsku')

  return radky.map((radek) => {
    const b = radek.split(';')
    const co = (b[iCo] ?? '').split(',')[0] ?? ''
    const x = cisloJtsk(b[iX] ?? '')
    const y = cisloJtsk(b[iY] ?? '')
    const castObce = b[iCast] ?? ''
    return {
      adm: Number(b[iAdm]),
      kodMomc: b[iMomc] ?? '',
      ulice: (b[iUlice] ?? '').trim() || castObce,
      castObce,
      typ: b[iTyp] === 'č.ev.' ? 'č.ev.' : 'č.p.',
      cisloDomovni: Number(b[iCp]),
      cisloOrientacni: co && co !== '0' ? `${co}${b[iZnak] ?? ''}` : '',
      psc: b[iPsc] ?? '',
      okrsek: cisloOkrsku(b[iOkrsek] ?? ''),
      // V CSV je JTSK kladně: X ≈ 741 000 je „východní" osa, Y ≈ 1 040 000 severní.
      poloha: x !== null && y !== null ? sjtskNaWgs84(-x, -y) : null,
    }
  })
}

/**
 * Číslo domu tak, jak ho Pražan napíše: „18/23a" (popisné/orientační), „18"
 * (jen popisné) nebo „č.ev. 6" u evidenčních čísel.
 */
export function oznaceniCisla(a: Pick<AdresniMisto, 'typ' | 'cisloDomovni' | 'cisloOrientacni'>): string {
  if (a.typ === 'č.ev.') return `č.ev. ${a.cisloDomovni}`
  return a.cisloOrientacni ? `${a.cisloDomovni}/${a.cisloOrientacni}` : String(a.cisloDomovni)
}

export type OkrsekVfr = {
  /** Kód okrsku v RÚIAN (stabilní identifikátor). */
  kod: number
  /** Číslo okrsku, jak ho zná volič a ČSÚ, např. 7001. */
  cislo: number
  kodObce: string
  kodMomc: string
  platiOd: string
  poznamka?: string
  /** Definiční bod, EPSG:5514. */
  stred: { x: number; y: number }
  /** Polygony → prstence (první vnější) → body [x, y] v EPSG:5514. */
  polygony: [number, number][][][]
}

const VZOR_VO = /<vf:VO gml:id="VO\.\d+">([\s\S]*?)<\/vf:VO>/g

function element(zaznam: string, nazev: string): string | undefined {
  return zaznam.match(new RegExp(`<${nazev}>([^<]*)</${nazev}>`))?.[1]
}

function odxml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function body(posList: string): [number, number][] {
  const cisla = posList.trim().split(/\s+/).map(Number)
  const vysledek: [number, number][] = []
  for (let i = 0; i + 1 < cisla.length; i += 2) vysledek.push([cisla[i]!, cisla[i + 1]!])
  return vysledek
}

/**
 * Projde GML a vrátí okrsky dané obce. Soubor má přes 150 MB, proto regulární
 * výrazy nad textem a ne DOM — na jeden průchod to stačí a paměť zůstane
 * v rozumných mezích.
 */
export function okrskyZeSpecialnihoVfr(xml: string, kodObce: string): OkrsekVfr[] {
  const vysledek: OkrsekVfr[] = []
  const znackaObce = `<voi:Obec><obi:Kod>${kodObce}</obi:Kod></voi:Obec>`
  for (const shoda of xml.matchAll(VZOR_VO)) {
    const zaznam = shoda[1]!
    if (!zaznam.includes(znackaObce)) continue
    const pos = element(zaznam, 'gml:pos') ?? ''
    const [sx, sy] = pos.trim().split(/\s+/).map(Number)
    const polygony: [number, number][][][] = []
    for (const polygon of zaznam.matchAll(/<gml:Polygon [\s\S]*?<\/gml:Polygon>/g)) {
      const prstence: [number, number][][] = []
      const vnejsi = polygon[0].match(/<gml:exterior>[\s\S]*?<gml:posList>([^<]*)<\/gml:posList>/)?.[1]
      if (vnejsi) prstence.push(body(vnejsi))
      for (const vnitrni of polygon[0].matchAll(/<gml:interior>[\s\S]*?<gml:posList>([^<]*)<\/gml:posList>/g)) {
        prstence.push(body(vnitrni[1]!))
      }
      if (prstence.length > 0) polygony.push(prstence)
    }
    const poznamka = element(zaznam, 'voi:Poznamka')
    vysledek.push({
      kod: Number(element(zaznam, 'voi:Kod')),
      cislo: Number(element(zaznam, 'voi:Cislo')),
      kodObce,
      kodMomc: zaznam.match(/<voi:Momc><mci:Kod>(\d+)<\/mci:Kod>/)?.[1] ?? '',
      platiOd: (element(zaznam, 'voi:PlatiOd') ?? '').slice(0, 10),
      ...(poznamka ? { poznamka: odxml(poznamka).trim() } : {}),
      stred: { x: sx ?? NaN, y: sy ?? NaN },
      polygony,
    })
  }
  return vysledek
}

export type GeoJsonPozice = [lon: number, lat: number]

/** Polygony v EPSG:5514 → geometrie GeoJSON ve WGS84. */
export function geometrieOkrsku(
  polygony: OkrsekVfr['polygony'],
): { type: 'Polygon'; coordinates: GeoJsonPozice[][] } | { type: 'MultiPolygon'; coordinates: GeoJsonPozice[][][] } {
  const prevedene = polygony.map((prstence) =>
    prstence.map((prstenec) =>
      prstenec.map(([x, y]) => {
        const b = sjtskNaWgs84(x, y)
        return [zaokrouhli(b.lon), zaokrouhli(b.lat)] as GeoJsonPozice
      }),
    ),
  )
  return prevedene.length === 1
    ? { type: 'Polygon', coordinates: prevedene[0]! }
    : { type: 'MultiPolygon', coordinates: prevedene }
}
