import { koalice, vyjednavani } from '#content'
import { kandidatka } from './kandidatky'
import { slugStrany, stranySMandaty } from './konecneVysledky'
import type { Vylouceni } from './koalice'
import type { ZastupitelstvoVysledek } from './vysledky'

export type Vyjednavani = (typeof vyjednavani)[number]
export type Udalost = Vyjednavani['udalosti'][number]

/** Magistrát a 22 velkých městských částí sledujeme podrobně. */
export const SLEDOVANE = [
  'magistrat',
  ...Array.from({ length: 22 }, (_, i) => `praha-${i + 1}`),
] as const

export function jeSledovane(slug: string): boolean {
  return (SLEDOVANE as readonly string[]).includes(slug)
}

export function vyjednavaniZastupitelstva(slug: string): Vyjednavani | undefined {
  return vyjednavani.find((v) => v.zastupitelstvo === slug)
}

export type Stav = 'bez-zprav' | 'jednani' | 'memorandum' | 'koalicni-smlouva' | 'zvoleno-vedeni'

export const POPIS_STAVU: Record<Stav, string> = {
  'bez-zprav': 'Zatím bez doložených zpráv',
  jednani: 'Probíhají jednání',
  memorandum: 'Podepsané memorandum',
  'koalicni-smlouva': 'Podepsaná koaliční smlouva',
  'zvoleno-vedeni': 'Zvolené vedení',
}

/**
 * Stav se neodhaduje, plyne z doložených událostí: nejdál dotažený krok,
 * který nevystřídal pozdější rozpad. Rozpad vrací stav zpátky na jednání.
 */
export function stavVyjednavani(v: Vyjednavani | undefined): Stav {
  if (!v) return 'bez-zprav'
  if (v.vedeni.length > 0) return 'zvoleno-vedeni'
  const serazene = [...v.udalosti].sort((a, b) => a.datum.localeCompare(b.datum))
  let stav: Stav = serazene.length > 0 ? 'jednani' : 'bez-zprav'
  for (const u of serazene) {
    if (u.typ === 'rozpad') stav = 'jednani'
    else if (u.typ === 'koalicni-smlouva') stav = 'koalicni-smlouva'
    else if (u.typ === 'memorandum' && stav !== 'koalicni-smlouva') stav = 'memorandum'
    else if (u.typ === 'volba') stav = 'zvoleno-vedeni'
  }
  return stav
}

/** Poslední doložená sestava (memorandum nebo smlouva), pokud nějaká je. */
export function dohodnutaSestava(v: Vyjednavani | undefined): string[] | undefined {
  if (!v) return undefined
  const dohody = v.udalosti
    .filter((u) => u.typ === 'memorandum' || u.typ === 'koalicni-smlouva' || u.typ === 'rozpad')
    .sort((a, b) => a.datum.localeCompare(b.datum))
  const posledni = dohody.at(-1)
  return posledni && posledni.typ !== 'rozpad' ? posledni.sestava : undefined
}

export function posledniUdalost(v: Vyjednavani | undefined): Udalost | undefined {
  return v ? [...v.udalosti].sort((a, b) => b.datum.localeCompare(a.datum))[0] : undefined
}

/** Vyloučení s odkazem, kde je doložené — u magistrátu i předvolební. */
export type DolozeneVylouceni = Vylouceni & { kdy: 'pred-volbami' | 'po-volbach' }

export function vylouceniZastupitelstva(slug: string): DolozeneVylouceni[] {
  const po: DolozeneVylouceni[] = (vyjednavaniZastupitelstva(slug)?.udalosti ?? [])
    .filter((u) => u.typ === 'vylouceni')
    .flatMap((u) =>
      u.subjekty.flatMap((kdo) =>
        u.vylucuje.map((koho) => ({ kdo, koho, deklarace: u.id, kdy: 'po-volbach' as const })),
      ),
    )
  // Předvolební deklarace existují jen pro magistrát (content/koalice.yaml).
  const pred: DolozeneVylouceni[] =
    slug === 'magistrat'
      ? koalice.deklarace.flatMap((d) =>
          d.vylucuje.map((koho) => ({ kdo: d.subjekt, koho, deklarace: d.id, kdy: 'pred-volbami' as const })),
        )
      : []
  return [...po, ...pred]
}

export type SubjektSMandaty = { slug: string; nazev: string; mandaty: number }

/** Subjekty se zastupiteli pod slugy z kandidátky — tak je zná vyjednávání. */
export function subjektySMandaty(z: ZastupitelstvoVysledek): SubjektSMandaty[] {
  return stranySMandaty(z).map((s) => ({
    slug: slugStrany(z, s) ?? String(s.cislo),
    nazev: s.nazev,
    mandaty: s.mandaty,
  }))
}

/** Název subjektu pro zobrazení: z výsledků, a když subjekt mandát nemá, z kandidátky. */
export function nazevSubjektu(z: ZastupitelstvoVysledek, slug: string): string {
  const strana = kandidatka(z.slug)?.strany.find((s) => s.slug === slug)
  const vysledek = strana ? z.strany.find((s) => s.cislo === strana.cislo) : undefined
  return vysledek?.nazev ?? strana?.zkratka ?? slug
}

/**
 * Vyloučení pro výčet koalic: jedno na dvojici subjektů, přednost má
 * povolební (je aktuálnější). Odkaz vede na doložení na webu.
 */
export function vylouceniProKoalice(slug: string): {
  kdo: string
  koho: string
  href: string
  kdy: 'pred-volbami' | 'po-volbach'
}[] {
  const odkaz = (v: DolozeneVylouceni) =>
    v.kdy === 'po-volbach' ? `#udalost-${v.deklarace}` : `/koalice#deklarace-${v.deklarace}`
  const podleDvojice = new Map<string, DolozeneVylouceni>()
  for (const v of vylouceniZastupitelstva(slug)) {
    const klic = `${v.kdo}>${v.koho}`
    const drivejsi = podleDvojice.get(klic)
    if (!drivejsi || (drivejsi.kdy === 'pred-volbami' && v.kdy === 'po-volbach')) podleDvojice.set(klic, v)
  }
  return [...podleDvojice.values()].map((v) => ({ kdo: v.kdo, koho: v.koho, href: odkaz(v), kdy: v.kdy }))
}

/** Událost spolu se zastupitelstvem, kde se stala — pro souhrnné přehledy. */
export type UdalostSMistem = Udalost & { zastupitelstvo: string }

/** Všechny doložené události napříč zastupitelstvy, od nejnovější. */
export function vsechnyUdalosti(): UdalostSMistem[] {
  return vyjednavani
    .flatMap((v) => v.udalosti.map((u) => ({ ...u, zastupitelstvo: v.zastupitelstvo })))
    .sort((a, b) => b.datum.localeCompare(a.datum) || a.zastupitelstvo.localeCompare(b.zastupitelstvo))
}

/** Kdy jsme vyjednávání naposledy ověřovali — nejnovější `overeno` ze všech souborů. */
export function naposledyOvereno(): string | undefined {
  return vyjednavani.map((v) => v.overeno).sort().at(-1)
}

/** Kolik zastupitelstev je v kterém stavu. */
export function pocetPodleStavu(slugy: readonly string[]): Record<Stav, number> {
  const pocty: Record<Stav, number> = {
    'bez-zprav': 0,
    jednani: 0,
    memorandum: 0,
    'koalicni-smlouva': 0,
    'zvoleno-vedeni': 0,
  }
  for (const slug of slugy) pocty[stavVyjednavani(vyjednavaniZastupitelstva(slug))]++
  return pocty
}
