/**
 * Sběr „Oznámení o době a místě konání voleb" z úředních desek městských částí.
 *
 *   pnpm import:desky
 *
 * Část městských částí zveřejňuje úřední desku jako otevřená data podle
 * otevřené formální normy (ofn.gov.cz/úřední-desky). U těch se oznámení najde
 * strojově. U zbytku umíme nabídnout jen odkaz na desku — a stránka to říká.
 *
 * Oznámení musí být vyvěšené nejpozději 15 dnů před volbami, tedy do 24. 9. 2026.
 * Do té doby je normální, že se nenajde nic.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { bezDiakritiky } from '../src/lib/slug'

const KOREN = join(__dirname, '..')
const SOUBOR = join(KOREN, 'data/uredni-desky/stav.json')

/**
 * Zákon mluví o „oznámení o době a místě konání voleb"; úřady to nazývají
 * různě. Hledáme proto jádro formulace, ne přesný název.
 */
const VZORY_OZNAMENI = [
  /o dobe a miste konani voleb/,
  /oznameni.{0,40}konani voleb/,
]
const VZOR_VOLEB = /vol(b|e)[byaáí]/

type Deska = {
  slug: string
  nazev: string
  webMC?: string
  urlDesky?: string
  urlOtevrenaData?: string
}

type Polozka = { nazev: string; url: string; vyveseno: string }

type Stav = {
  slug: string
  nazev: string
  zdroj: 'otevrena-data' | 'jen-odkaz'
  stav: 'oznameni-nalezeno' | 'ceka-se' | 'bez-otevrenych-dat' | 'zdroj-nedostupny'
  urlDesky?: string
  oznameni?: Polozka
  dalsiVolebni: Polozka[]
  poznamka?: string
}

const norm = (t: string) => bezDiakritiky(t).toLowerCase()

function nactiDesky(): Deska[] {
  const cesta = join(KOREN, 'content/uredni-desky.yaml')
  const text = readFileSync(cesta, 'utf8')
  // Záměrně bez YAML knihovny — soubor má plochou a předvídatelnou strukturu.
  const desky: Deska[] = []
  let akt: Deska | null = null
  for (const radek of text.split('\n')) {
    const polozka = radek.match(/^ {2}- slug:\s*(\S+)/)
    if (polozka?.[1]) {
      if (akt) desky.push(akt)
      akt = { slug: polozka[1], nazev: '' }
      continue
    }
    const pole = radek.match(/^ {4}(\w+):\s*"?([^"]*)"?\s*$/)
    if (pole && akt) {
      const [, klic, hodnota] = pole
      if (klic === 'nazev') akt.nazev = hodnota ?? ''
      if (klic === 'webMC') akt.webMC = hodnota || undefined
      if (klic === 'urlDesky') akt.urlDesky = hodnota || undefined
      if (klic === 'urlOtevrenaData') akt.urlOtevrenaData = hodnota || undefined
    }
  }
  if (akt) desky.push(akt)
  return desky
}

type OfnInformace = {
  název?: { cs?: string }
  url?: string
  vyvěšení?: { datum?: string }
}

async function zkontrolujDesku(deska: Deska): Promise<Stav> {
  const zaklad: Stav = {
    slug: deska.slug,
    nazev: deska.nazev,
    zdroj: deska.urlOtevrenaData ? 'otevrena-data' : 'jen-odkaz',
    stav: 'bez-otevrenych-dat',
    urlDesky: deska.urlDesky,
    dalsiVolebni: [],
  }

  if (!deska.urlOtevrenaData) return zaklad

  try {
    const odpoved = await fetch(deska.urlOtevrenaData, {
      headers: { accept: 'application/ld+json, application/json' },
      signal: AbortSignal.timeout(30_000),
    })
    if (!odpoved.ok) {
      return { ...zaklad, stav: 'zdroj-nedostupny', poznamka: `HTTP ${odpoved.status}` }
    }
    const data = (await odpoved.json()) as { informace?: OfnInformace[] }
    const polozky: Polozka[] = (data.informace ?? [])
      .map((i) => ({
        nazev: i.název?.cs ?? '',
        url: i.url ?? '',
        vyveseno: i.vyvěšení?.datum ?? '',
      }))
      .filter((p) => p.nazev)

    const volebni = polozky.filter((p) => VZOR_VOLEB.test(norm(p.nazev)))
    const oznameni = volebni.find((p) => VZORY_OZNAMENI.some((v) => v.test(norm(p.nazev))))

    return {
      ...zaklad,
      stav: oznameni ? 'oznameni-nalezeno' : 'ceka-se',
      oznameni,
      dalsiVolebni: volebni.filter((p) => p !== oznameni).slice(0, 8),
    }
  } catch (chyba) {
    return { ...zaklad, stav: 'zdroj-nedostupny', poznamka: popisChyby(chyba) }
  }
}

/**
 * Rozlišujeme výpadek od vady konfigurace. Část úřadů neposílá mezilehlý
 * certifikát — prohlížeč i curl si ho dotáhnou přes AIA, Node ne. Ověřování
 * kvůli tomu nevypínáme; radši to popíšeme přesně, ať je co nahlásit úřadu.
 */
function popisChyby(chyba: unknown): string {
  const zprava = chyba instanceof Error ? (chyba.cause as Error | undefined)?.message ?? chyba.message : String(chyba)
  if (/unable to verify the first certificate|self-signed certificate/i.test(zprava)) {
    return 'Server neposílá mezilehlý certifikát, takže se řetěz nedá ověřit. Vada na straně úřadu.'
  }
  if (/timed out|aborted/i.test(zprava)) return 'Server neodpověděl včas.'
  return zprava
}

async function main() {
  const desky = nactiDesky()
  console.log(`Kontroluji ${desky.length} úředních desek…`)

  const stavy: Stav[] = []
  // Sekvenčně — cílem není zátěžový test cizích serverů.
  for (const deska of desky) {
    stavy.push(await zkontrolujDesku(deska))
  }

  const souhrn = stavy.reduce<Record<string, number>>((acc, s) => {
    acc[s.stav] = (acc[s.stav] ?? 0) + 1
    return acc
  }, {})

  mkdirSync(join(SOUBOR, '..'), { recursive: true })
  writeFileSync(
    SOUBOR,
    JSON.stringify(
      { zkontrolovano: new Date().toISOString().slice(0, 10), stavy },
      null,
      2,
    ) + '\n',
  )

  console.log('Hotovo:', JSON.stringify(souhrn))
  for (const s of stavy.filter((x) => x.stav === 'oznameni-nalezeno')) {
    console.log(`  ${s.nazev}: ${s.oznameni?.nazev}`)
  }
}

main().catch((chyba) => {
  console.error(chyba)
  process.exit(1)
})
