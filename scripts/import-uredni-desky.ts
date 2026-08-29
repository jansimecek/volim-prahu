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
import { jeOdkazMrtvy, popisChybyOdkazu } from '../src/lib/odkazy'
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
  /** Redakční vysvětlení, proč u téhle části něco nejde. Dostane se na web. */
  poznamka?: string
}

type Polozka = { nazev: string; url: string; vyveseno: string }

type Stav = {
  slug: string
  nazev: string
  zdroj: 'otevrena-data' | 'jen-odkaz'
  stav: 'oznameni-nalezeno' | 'ceka-se' | 'bez-otevrenych-dat' | 'zdroj-nedostupny'
  urlDesky?: string
  /**
   * Odpovídá adresa desky? Je to jediný odkaz, po kterém volič klikne, aby
   * zjistil, kde se u něj volí — poslat ho na 404 je horší než neposlat ho
   * nikam. Když je `false`, stránka odkaz nenabídne.
   */
  deskaDostupna?: boolean
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
      if (klic === 'poznamka') akt.poznamka = hodnota || undefined
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
    // Redakční poznámka z YAMLu je výchozí; běhové chyby ji přepíšou,
    // protože o aktuálním stavu vypovídají líp.
    poznamka: deska.poznamka,
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
    return { ...zaklad, stav: 'zdroj-nedostupny', poznamka: popisChybyOdkazu(chyba).popis }
  }
}

/**
 * Odpovídá lidská adresa desky?
 *
 * Kontroluje se zvlášť od otevřených dat, protože se rozcházejí: městská
 * část může mít funkční strojový výstup a přitom přestěhovanou stránku,
 * nebo naopak. Opakuje se jednou — jeden výpadek uprostřed pětapadesáti
 * sekvenčních požadavků nesmí vypadat jako zrušená stránka.
 */
async function overDesku(
  url: string | undefined,
): Promise<{ dostupna?: boolean; poznamka?: string }> {
  if (!url) return {}
  for (const pokus of [1, 2]) {
    try {
      const odpoved = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'user-agent': 'Mozilla/5.0 (kontrola odkazu, volimprahu.cz)' },
        signal: AbortSignal.timeout(20_000),
      })
      if (odpoved.ok) return { dostupna: true }
      if (pokus === 2 || odpoved.status < 500) {
        return { dostupna: false, poznamka: `Adresa desky vrací HTTP ${odpoved.status}.` }
      }
    } catch (chyba) {
      const { druh, popis } = popisChybyOdkazu(chyba)
      // Neúplný řetěz certifikátů vidí jen strojový klient. Odkaz zůstává
      // pro čtenáře použitelný, jen si o tom poznamenáme, co je špatně.
      if (!jeOdkazMrtvy(druh)) return { dostupna: true, poznamka: popis }
      if (pokus === 2) return { dostupna: false, poznamka: popis }
    }
    await new Promise((hotovo) => setTimeout(hotovo, 3_000))
  }
  return { dostupna: false }
}

async function main() {
  const desky = nactiDesky()
  console.log(`Kontroluji ${desky.length} úředních desek…`)

  const stavy: Stav[] = []
  // Sekvenčně — cílem není zátěžový test cizích serverů.
  for (const deska of desky) {
    const stav = await zkontrolujDesku(deska)
    const deska2 = await overDesku(stav.urlDesky)
    stavy.push({
      ...stav,
      deskaDostupna: deska2.dostupna,
      poznamka: stav.poznamka ?? deska2.poznamka,
    })
  }

  const mrtve = stavy.filter((s) => s.deskaDostupna === false)
  if (mrtve.length > 0) {
    console.log(`\nAdresa desky neodpovídá u ${mrtve.length} částí — opravit v content/uredni-desky.yaml:`)
    for (const s of mrtve) console.log(`  ${s.nazev}: ${s.urlDesky}`)
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
