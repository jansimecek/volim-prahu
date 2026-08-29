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

const KOREN = join(__dirname, '..')

/**
 * Poziční pole místo objektů — u osmi tisíc položek ušetří názvy klíčů
 * zhruba polovinu velikosti souboru: [nazev, popis, url, typ].
 */
type Zaznam = [nazev: string, popis: string, url: string, typ: 'k' | 's' | 'm' | 'p' | 'z']

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

// Redakční stránky
const stranky = JSON.parse(readFileSync(join(KOREN, '.velite/stranky.json'), 'utf8')) as {
  slug: string
  title: string
  popis: string
}[]
for (const s of stranky) {
  zaznamy.push([s.title, s.popis, `/${s.slug}`, 'p'])
}

/**
 * Zprávičky. Koncepty do indexu nepatří, stejně jako se nezobrazují na webu.
 *
 * Zprávičky s výsledky průzkumu se nezařazují vůbec — index je statický
 * soubor generovaný při buildu, takže by v něm po začátku moratoria zůstal
 * nadpis s procenty viset, dokud by se web znovu nenasadil.
 */
const zpravicky = JSON.parse(readFileSync(join(KOREN, '.velite/zpravicky.json'), 'utf8')) as {
  slug: string
  nadpis: string
  shrnuti: string
  koncept: boolean
  obsahujePruzkum: boolean
}[]
for (const z of zpravicky.filter((x) => !x.koncept && !x.obsahujePruzkum)) {
  zaznamy.push([z.nadpis, z.shrnuti, `/zpravicky/${z.slug}`, 'z'])
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
