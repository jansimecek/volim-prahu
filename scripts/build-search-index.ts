/**
 * Sestaví vyhledávací index pro celý web.
 *
 *   pnpm build:search
 *
 * Index se generuje při buildu do public/ a v prohlížeči se načítá až při
 * první interakci s vyhledáváním — bez backendu a bez Algolie.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ID_OKRUHU, type IdOkruhu } from '../src/lib/okruhy'

const KOREN = join(__dirname, '..')

/**
 * Poziční pole místo objektů — u osmi tisíc položek ušetří názvy klíčů
 * zhruba polovinu velikosti souboru: [nazev, popis, url, typ].
 */
type Zaznam = [
  nazev: string,
  popis: string,
  url: string,
  typ: 'k' | 's' | 'm' | 'o' | 'p' | 'z' | 'r',
]

const zaznamy: Zaznam[] = []

// Kandidáti — jedna položka na osobu, i když kandiduje na víc listinách.
const adresarKandidatek = join(KOREN, 'data/kandidatky')
const osoby = new Map<string, { jmeno: string; kde: string[]; povolani: string }>()

if (existsSync(adresarKandidatek)) {
  for (const soubor of readdirSync(adresarKandidatek).filter((f) => f.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(adresarKandidatek, soubor), 'utf8')) as {
      zastupitelstvo: { nazev: string }
      strany: {
        nazev: string
        kandidati: {
          slug: string
          jmeno: string
          prijmeni: string
          titulPred: string
          povolani: string
        }[]
      }[]
    }
    for (const strana of data.strany) {
      for (const k of strana.kandidati) {
        const zaznam = osoby.get(k.slug) ?? {
          jmeno: `${k.jmeno} ${k.prijmeni}`,
          kde: [],
          povolani: k.povolani,
        }
        // Jen zastupitelstvo, ne celý název strany — ten bývá i několik set znaků.
        if (!zaznam.kde.includes(data.zastupitelstvo.nazev)) {
          zaznam.kde.push(data.zastupitelstvo.nazev)
        }
        osoby.set(k.slug, zaznam)
      }
    }
  }
}

for (const [slug, osoba] of osoby) {
  const povolani = osoba.povolani.length > 60 ? osoba.povolani.slice(0, 57) + '…' : osoba.povolani
  zaznamy.push([
    osoba.jmeno,
    [povolani, osoba.kde.join(', ')].filter(Boolean).join(' · '),
    `/kandidat/${slug}`,
    'k',
  ])
}

// Volební strany na magistrátní úrovni
const strany = JSON.parse(readFileSync(join(KOREN, '.velite/strany.json'), 'utf8')) as {
  slug: string
  zkratka: string
  uroven: string
  kodStrany: string
}[]
const magistratniListina = existsSync(join(adresarKandidatek, 'magistrat.json'))
  ? (JSON.parse(readFileSync(join(adresarKandidatek, 'magistrat.json'), 'utf8')) as {
      strany: { kodStrany: string; nazev: string }[]
    })
  : { strany: [] }

for (const strana of strany.filter((s) => s.uroven === 'magistrat')) {
  const nazev =
    magistratniListina.strany.find((s) => s.kodStrany === strana.kodStrany)?.nazev ??
    strana.zkratka
  zaznamy.push([
    nazev.length > 80 ? nazev.slice(0, 77) + '…' : nazev,
    `Volební strana · ${strana.zkratka}`,
    `/praha/strana/${strana.slug}`,
    's',
  ])
}

// Městské části
const ciselnik = JSON.parse(
  readFileSync(join(KOREN, 'data/ciselniky/zastupitelstva.json'), 'utf8'),
) as { zastupitelstva: { slug: string; nazev: string; jeMagistrat: boolean; mandaty: number }[] }

for (const z of ciselnik.zastupitelstva.filter((x) => !x.jeMagistrat)) {
  zaznamy.push([z.nazev, `Městská část · ${z.mandaty} mandátů`, `/mestska-cast/${z.slug}`, 'm'])
}

// Senátní obvody a jejich kandidáti. Kandidát do Senátu nemá vlastní profil,
// odkaz vede na jeho řádek v tabulce obvodu.
const obvody = JSON.parse(readFileSync(join(KOREN, '.velite/senat.json'), 'utf8')) as {
  slug: string
  cislo: number
  nazev: string
}[]
for (const o of obvody) {
  zaznamy.push([
    `Senátní obvod ${o.cislo} – ${o.nazev}`,
    'Senát · kdo kandiduje a které městské části v obvodu volí',
    `/senat/${o.slug}`,
    'o',
  ])
}
const cestaSenat = join(KOREN, 'data/senat/kandidati.json')
if (existsSync(cestaSenat)) {
  const { kandidati } = JSON.parse(readFileSync(cestaSenat, 'utf8')) as {
    kandidati: { obvod: number; cislo: number; slug: string; jmeno: string; prijmeni: string; volebniStrana: string }[]
  }
  for (const k of kandidati) {
    const obvod = obvody.find((o) => o.cislo === k.obvod)
    if (!obvod) continue
    zaznamy.push([
      `${k.jmeno} ${k.prijmeni}`,
      [`Kandidát do Senátu · obvod ${obvod.cislo} ${obvod.nazev}`, k.volebniStrana]
        .filter(Boolean)
        .join(' · '),
      // Stejný tvar kotvy jako v KandidatiSenatu, viz senat/[obvod]/page.tsx.
      `/senat/${obvod.slug}#kandidat-${k.slug}-${k.cislo}`,
      'k',
    ])
  }
}

// Rozcestníky sekcí — bez nich hledání „senát" nebo „anketa" nenašlo nic,
// i když stránka existuje.
const ROZCESTNIKY: [nazev: string, popis: string, url: string][] = [
  ['Magistrát a kandidátky', 'Volební strany do Zastupitelstva hlavního města Prahy', '/praha'],
  ['Městské části', 'Všech 57 městských částí, jejich kandidátky a volební místnosti', '/mestska-cast'],
  ['Senát', 'Ve kterých obvodech se letos volí senátor a kdo kandiduje', '/senat'],
  ['Témata', 'Postoje stran k bydlení, dopravě, rozpočtu a dalším sporným otázkám', '/temata'],
  ['Aktuálně', 'Novinky z kampaně a z přípravy voleb', '/aktualne'],
  ['Anketa čtenářů', 'Hlasování čtenářů o tom, co by měla příští rada řešit', '/hlasovani'],
  ['Rozhovory s kandidáty', 'Rozhovory s lídry kandidátek v médiích', '/rozhovory'],
]
for (const [nazev, popis, url] of ROZCESTNIKY) zaznamy.push([nazev, popis, url, 'p'])

// Okruhy srovnání témat. Názvy žijí v src/lib/temata.ts, který importuje
// zkompilovaný obsah, takže se sem nedá natáhnout — opakují se tu ručně.
// Typ Record<IdOkruhu, …> aspoň pohlídá, že žádný okruh nechybí.
const OKRUHY_HLEDANI: Record<IdOkruhu, string> = {
  bydleni: 'Bydlení',
  doprava: 'Doprava a MHD',
  'uzemni-plan': 'Územní plán a rozvoj',
  rozpocet: 'Rozpočet a městské firmy',
  skolstvi: 'Školství',
  prostredi: 'Životní prostředí a energetika',
  socialni: 'Sociální služby, zdraví a bezpečnost',
}
for (const id of ID_OKRUHU) {
  zaznamy.push([
    `Téma: ${OKRUHY_HLEDANI[id]}`,
    'Co k tématu říkají kandidující strany a co z toho může město splnit',
    `/temata#${id}`,
    'p',
  ])
}

// Redakční stránky
const stranky = JSON.parse(readFileSync(join(KOREN, '.velite/stranky.json'), 'utf8')) as {
  slug: string
  title: string
  popis: string
}[]
for (const s of stranky) {
  zaznamy.push([s.title, s.popis, `/${s.slug}`, 'p'])
}

// Kalendář debat nemá redakční MDX, text stránky je v kódu.
zaznamy.push([
  'Debaty kandidátů na primátora',
  'Kdy a kde se utkají kandidáti na pražského primátora v televizi, rozhlase a na webu.',
  '/debaty',
  'p',
])

/**
 * Aktuálně. Koncepty do indexu nepatří, stejně jako se nezobrazují na webu.
 *
 * Aktuálně s výsledky průzkumu se nezařazují vůbec — index je statický
 * soubor generovaný při buildu, takže by v něm po začátku moratoria zůstal
 * nadpis s procenty viset, dokud by se web znovu nenasadil.
 */
const aktuality = JSON.parse(readFileSync(join(KOREN, '.velite/aktuality.json'), 'utf8')) as {
  slug: string
  nadpis: string
  shrnuti: string
  koncept: boolean
  obsahujePruzkum: boolean
}[]
for (const z of aktuality.filter((x) => !x.koncept && !x.obsahujePruzkum)) {
  zaznamy.push([z.nadpis, z.shrnuti, `/aktualne/${z.slug}`, 'z'])
}

// Rozhovory — hledá se podle titulku, popis nese médium a datum.
const rozhovory = JSON.parse(readFileSync(join(KOREN, '.velite/rozhovory.json'), 'utf8')) as {
  slug: string
  nadpis: string
  medium: string
  datum: string
}[]
for (const r of rozhovory) {
  zaznamy.push([r.nadpis, `Rozhovor · ${r.medium} · ${r.datum.slice(0, 10)}`, `/rozhovory#${r.slug}`, 'r'])
}

mkdirSync(join(KOREN, 'public'), { recursive: true })
const cesta = join(KOREN, 'public/hledani.json')
writeFileSync(cesta, JSON.stringify(zaznamy))

const podleTypu = zaznamy.reduce<Record<string, number>>((acc, z) => {
  acc[z[3]] = (acc[z[3]] ?? 0) + 1
  return acc
}, {})
const velikost = (readFileSync(cesta).length / 1024).toFixed(0)
console.log(`Index: ${zaznamy.length} položek (${velikost} kB)`, podleTypu)
