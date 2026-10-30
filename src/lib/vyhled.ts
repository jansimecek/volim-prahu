import { vyhled, vyjednavani } from '#content'
import { datumCesky } from './cestina'
import { lhutyUstavujichZasedani, type Lhuty } from './terminy'
import type { Vyjednavani } from './vyjednavani'

/**
 * Výhled na titulní straně: co nás čeká. Žádná předpověď — skládá se ze tří
 * doložitelných zdrojů a každý termín říká, odkud je:
 *
 * - zákonné lhůty spočtené z vyhlášení výsledků (src/lib/terminy.ts),
 * - ustavující zasedání, která dosavadní vedení svolalo (pole
 *   ustavujiciZasedani ve vyjednávání),
 * - ohlášené plány stran z content/vyhled.yaml, každý s odkazem na doloženou
 *   událost ve vyjednávání, nebo s vlastním zdrojem,
 * - řízení u soudu o neplatnosti voleb z téhož souboru, doložená úřední deskou
 *   soudu; kde běží, ustavující zasedání čeká na rozhodnutí.
 */

export type DruhTerminu = 'lhuta' | 'svolano' | 'soud' | 'ohlaseno'

export const POPIS_DRUHU: Record<DruhTerminu, string> = {
  lhuta: 'zákonná lhůta',
  svolano: 'svolané zasedání',
  soud: 'řízení u soudu',
  ohlaseno: 'ohlášený plán',
}

export type Termin = {
  id: string
  druh: DruhTerminu
  /** Nejbližší možný den. */
  datum: string
  /** Do kdy to má nastat; podle toho se řadí a pak termín zmizí. */
  platiDo: string
  /** Nepřesný termín slovy, jinak se vypíše datum. */
  kdy?: string
  /** Slug zastupitelstva, „senat“, nebo null, když se termín týká všech. */
  zastupitelstvo: string | null
  nadpis: string
  text: string
  podminka?: string
  /** Id události ve vyjednávání, kde je plán doložený. */
  udalost?: string
  zdroj: { text: string; url: string }
}

type PolozkaVyhledu = (typeof vyhled)['polozky'][number]

/** Velite vydává data jako celé ISO časy; výhled počítá s dny. */
const den = (iso: string) => iso.slice(0, 10)

/** Sobota nebo neděle; poledne UTC, aby den neposunulo časové pásmo. */
const naVikend = (iso: string) => [0, 6].includes(new Date(`${iso}T12:00:00Z`).getUTCDay())

function terminyZeZakona(lhuty: Lhuty | null): Termin[] {
  if (!lhuty) return []
  return [
    {
      id: 'lhuta-navrhy-soudu',
      druh: 'lhuta',
      datum: lhuty.navrhSouduDo,
      platiDo: lhuty.navrhSouduDo,
      zastupitelstvo: null,
      nadpis: 'Konec lhůty pro návrhy soudu na neplatnost voleb',
      text: 'Kde někdo návrh podá, posouvá se tamní ustavující zasedání až za rozhodnutí soudu.',
      zdroj: { text: '§ 60 zák. č. 491/2001 Sb.', url: 'https://www.zakonyprolidi.cz/cs/2001-491#p60' },
    },
    {
      id: 'lhuta-ustavujici-zasedani',
      druh: 'lhuta',
      datum: lhuty.zasedaniNejpozdeji,
      platiDo: lhuty.zasedaniNejpozdeji,
      zastupitelstvo: null,
      nadpis: 'Nejzazší den pro ustavující zasedání',
      text:
        'Platí pro zastupitelstvo města i městských částí (u nich § 91 zákona o obcích). Odkládá ho jen návrh soudu na neplatnost voleb nebo hlasování, ne návrh proti volbě jednotlivého kandidáta.' +
        (naVikend(lhuty.zasedaniNejpozdeji)
          ? ' Lhůta končí o víkendu; část zastupitelstev svolává zasedání až na nejbližší pracovní den.'
          : ''),
      zdroj: { text: '§ 61 zák. č. 131/2000 Sb.', url: 'https://www.zakonyprolidi.cz/cs/2000-131#p61' },
    },
  ]
}

function svolanaZasedani(data: readonly Vyjednavani[]): Termin[] {
  return data.flatMap((v) => {
    const z = v.ustavujiciZasedani
    const zdroj = z && v.zdroje.find((x) => x.id === z.zdroj)
    if (!z || !zdroj) return []
    return [
      {
        id: `svolano-${v.zastupitelstvo}`,
        druh: 'svolano' as const,
        datum: den(z.datum),
        platiDo: den(z.datum),
        zastupitelstvo: v.zastupitelstvo,
        nadpis: 'Ustavující zasedání',
        text: 'Svolalo ho dosavadní vedení.',
        zdroj: { text: `${zdroj.medium}, ${datumCesky(zdroj.datum)}`, url: zdroj.url },
      },
    ]
  })
}

function ohlasenePlany(polozky: readonly PolozkaVyhledu[], data: readonly Vyjednavani[]): Termin[] {
  return polozky.flatMap((p) => {
    let zdroj = p.zdroj
    if (p.udalost) {
      const v = data.find((x) => x.zastupitelstvo === p.zastupitelstvo)
      const u = v?.udalosti.find((x) => x.id === p.udalost)
      const prvni = u && v?.zdroje.find((x) => x.id === u.zdroje[0])
      // Plán bez dohledatelné události nevypisujeme; validace na to upozorní.
      if (!prvni) return []
      zdroj = { text: `${prvni.medium}, ${datumCesky(prvni.datum)}`, url: prvni.url }
    }
    if (!zdroj) return []
    return [
      {
        id: p.id,
        druh: p.druh,
        datum: den(p.datum),
        platiDo: den(p.platiDo ?? p.datum),
        kdy: p.kdy,
        zastupitelstvo: p.zastupitelstvo,
        nadpis: p.nadpis,
        text: p.text.trim(),
        podminka: p.podminka,
        udalost: p.udalost,
        zdroj,
      },
    ]
  })
}

/** Termíny, které ještě neuplynuly, od nejbližšího. `dnes` je RRRR-MM-DD v pražském čase. */
export function sestavVyhled(
  dnes: string,
  vstup: { lhuty: Lhuty | null; polozky: readonly PolozkaVyhledu[]; vyjednavani: readonly Vyjednavani[] },
): Termin[] {
  return [
    ...terminyZeZakona(vstup.lhuty),
    ...svolanaZasedani(vstup.vyjednavani),
    ...ohlasenePlany(vstup.polozky, vstup.vyjednavani),
  ]
    .filter((t) => t.platiDo >= dnes)
    .sort((a, b) => a.platiDo.localeCompare(b.platiDo) || a.datum.localeCompare(b.datum))
}

export function vyhledOd(dnes: string): Termin[] {
  return sestavVyhled(dnes, { lhuty: lhutyUstavujichZasedani(), polozky: vyhled.polozky, vyjednavani })
}
