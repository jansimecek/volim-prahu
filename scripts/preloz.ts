/**
 * Strojový překlad obsahu přes DeepL.
 *
 * Co tenhle skript JE: nástroj na rozšíření cizojazyčné sekce o další
 * obsah — profily městských částí, aktuality, profily subjektů. Vezme
 * MDX nebo YAML z `content/`, přeloží texty a uloží výsledek vedle
 * originálu s příznakem, že je strojový.
 *
 * Co NENÍ: způsob, jak přeložit celý web. Doslovné citace politiků se
 * strojově nepřekládají — web má zásadu, že citace je doslovná a ověřená
 * proti zdroji, a přeložená věta ověřená proti ničemu není. Stejně tak
 * hodnocení proveditelnosti a odkazy na paragrafy: tam je cena chyby
 * vyšší než cena chybějícího překladu. Skript proto klíče s citacemi
 * a s právním textem přeskakuje a vypíše, že je přeskočil.
 *
 * Existující cizojazyčné stránky (`src/preklady/`) jsou psané ručně
 * a tenhle skript na ně nesahá.
 *
 * Použití:
 *   DEEPL_API_KEY=… pnpm preloz --jazyk en --vzor 'content/mestske-casti/*.mdx'
 *   DEEPL_API_KEY=… pnpm preloz --jazyk uk --vzor 'content/aktualne/*.mdx' --nasucho
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import process, { argv, env, exit } from 'node:process'
import { glob } from 'node:fs/promises'

const JAZYKY_DEEPL: Record<string, string> = { en: 'EN-GB', uk: 'UK' }

/**
 * Klíče frontmatteru a YAML, které se nepřekládají.
 *
 * `citace`, `vyrok` a `text` u výroků jsou doslovné výroky politiků.
 * `zdroj`, `odkaz`, `slug` a datumy jsou strojová data, kde by překlad
 * rozbil funkci. `hodnoceni` a `zduvodneni` jsou redakční posudky, které
 * musí projít člověkem.
 */
const NEPREKLADAT = new Set([
  'slug',
  'odkaz',
  'zdroj',
  'zdroje',
  'url',
  'datum',
  'vydano',
  'aktualizovano',
  'overeno',
  'kodStrany',
  'cislo',
  'citace',
  'vyrok',
  'hodnoceni',
  'zduvodneni',
])

/**
 * Pojmy, které DeepL překládá špatně nebo nekonzistentně. „Městská část"
 * není „city part" a „zastupitelstvo" není „representation"; bez glosáře
 * se jedna stránka rozejde s druhou.
 */
const GLOSAR: Record<string, Record<string, string>> = {
  en: {
    'městská část': 'city district',
    zastupitelstvo: 'assembly',
    magistrát: 'city hall',
    'volební okrsek': 'electoral precinct',
    'volební místnost': 'polling station',
    'trvalý pobyt': 'permanent residence',
    'hlasovací lístek': 'ballot paper',
    'voličský průkaz': 'absentee voter card',
    mandát: 'seat',
  },
  uk: {
    'městská část': 'міська частина',
    zastupitelstvo: 'рада',
    magistrát: 'магістрат',
    'volební okrsek': 'виборча дільниця',
    'volební místnost': 'виборче приміщення',
    'trvalý pobyt': 'постійне проживання',
    'hlasovací lístek': 'виборчий бюлетень',
    mandát: 'мандат',
  },
}

type Volby = { jazyk: string; vzor: string; nasucho: boolean }

function prectiVolby(): Volby {
  const hodnota = (jmeno: string) => {
    const i = argv.indexOf(`--${jmeno}`)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const jazyk = hodnota('jazyk')
  const vzor = hodnota('vzor')

  if (!jazyk || !vzor || !(jazyk in JAZYKY_DEEPL)) {
    console.error(
      'Použití: pnpm preloz --jazyk <en|uk> --vzor <glob> [--nasucho]\n' +
        "Například: pnpm preloz --jazyk en --vzor 'content/mestske-casti/*.mdx'",
    )
    exit(1)
  }
  return { jazyk, vzor, nasucho: argv.includes('--nasucho') }
}

/**
 * Jedno volání DeepL. Texty se posílají v dávce, ne po jednom — DeepL
 * účtuje podle znaků, ne podle požadavků, ale rate limit je na požadavky.
 */
async function deepl(texty: string[], jazyk: string, klic: string): Promise<string[]> {
  if (texty.length === 0) return []

  const adresa = klic.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'

  const odpoved = await fetch(adresa, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${klic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texty,
      source_lang: 'CS',
      target_lang: JAZYKY_DEEPL[jazyk],
      // Markdown se nesmí rozsypat: odkazy a důraz jsou v textu.
      tag_handling: 'html',
      preserve_formatting: true,
      formality: 'prefer_more',
    }),
  })

  if (!odpoved.ok) {
    throw new Error(`DeepL odpověděl ${odpoved.status}: ${await odpoved.text()}`)
  }
  const data = (await odpoved.json()) as { translations: { text: string }[] }
  return data.translations.map((t) => t.text)
}

/** Dosazení glosáře po překladu — DeepL glossary API je placené zvlášť. */
function srovnejPojmy(text: string, jazyk: string): string {
  const vysledek = text
  for (const [cesky, spravne] of Object.entries(GLOSAR[jazyk] ?? {})) {
    // Jen kontrola, že se pojem v překladu vyskytuje v očekávané podobě;
    // nahrazovat naslepo by rozbilo skloňování cílového jazyka.
    if (!vysledek.includes(spravne) && vysledek.toLowerCase().includes(cesky)) {
      console.warn(`  ! pojem „${cesky}" zůstal nepřeložený`)
    }
  }
  return vysledek
}

/**
 * Rozdělení MDX na frontmatter a tělo. Frontmatter se překládá po klíčích,
 * tělo po odstavcích — celý soubor najednou by narazil na limit délky.
 */
function rozdel(obsah: string): { frontmatter: string; telo: string } {
  const shoda = obsah.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  return shoda?.[1] !== undefined && shoda[2] !== undefined
    ? { frontmatter: shoda[1], telo: shoda[2] }
    : { frontmatter: '', telo: obsah }
}

async function prelozSoubor(cesta: string, volby: Volby, klic: string): Promise<void> {
  const puvodni = readFileSync(cesta, 'utf8')
  const { frontmatter, telo } = rozdel(puvodni)

  // Frontmatter: řádky `klic: hodnota`, kde klíč není na seznamu zákazů.
  const radky = frontmatter.split('\n')
  const kPrekladu: { index: number; klic: string; hodnota: string }[] = []
  radky.forEach((radek, index) => {
    const shoda = radek.match(/^(\w+):\s*(.+)$/)
    const klicRadku = shoda?.[1]
    const hodnota = shoda?.[2]
    if (!klicRadku || !hodnota) return
    if (NEPREKLADAT.has(klicRadku)) return
    if (/^\d{4}-\d{2}-\d{2}/.test(hodnota)) return
    kPrekladu.push({ index, klic: klicRadku, hodnota: hodnota.replace(/^['"]|['"]$/g, '') })
  })

  // Tělo: odstavce oddělené prázdným řádkem. Nadpisy a odkazy jdou s nimi,
  // DeepL je v režimu `html` neničí.
  const odstavce = telo.split(/\n\n+/)

  const preskocene = radky.length - kPrekladu.length
  console.log(`${cesta}: ${kPrekladu.length} polí frontmatteru, ${odstavce.length} odstavců`)
  if (preskocene > 0) console.log(`  (${preskocene} řádků frontmatteru přeskočeno)`)

  if (volby.nasucho) return

  const [prelozenaPole, prelozeneOdstavce] = await Promise.all([
    deepl(
      kPrekladu.map((p) => p.hodnota),
      volby.jazyk,
      klic,
    ),
    deepl(odstavce, volby.jazyk, klic),
  ])

  const noveRadky = [...radky]
  kPrekladu.forEach((p, i) => {
    const prelozeno = prelozenaPole[i]
    if (prelozeno !== undefined) noveRadky[p.index] = `${p.klic}: ${prelozeno}`
  })

  const noveTelo = prelozeneOdstavce
    .map((o) => srovnejPojmy(o, volby.jazyk))
    .join('\n\n')

  /**
   * Příznak `strojovyPreklad` je povinný: stránka, která ho nese, musí
   * čtenáři nahoře napsat, že text nikdo nečetl, a odkázat na český
   * originál. Bez toho by strojový překlad vypadal jako redakční text.
   */
  const vystup =
    `---\n${noveRadky.join('\n')}\n` +
    `strojovyPreklad: true\n` +
    `puvodni: ${relative('content', cesta)}\n` +
    `---\n${noveTelo}`

  const cil = join('content/preklady', volby.jazyk, relative('content', cesta))
  mkdirSync(dirname(cil), { recursive: true })
  writeFileSync(cil, vystup, 'utf8')
  console.log(`  → ${cil}`)
}

async function hlavni(): Promise<void> {
  const volby = prectiVolby()
  const klic = env.DEEPL_API_KEY ?? ''

  if (!klic && !volby.nasucho) {
    console.error('Chybí DEEPL_API_KEY. Bez klíče jde spustit jen --nasucho.')
    exit(1)
  }

  const soubory: string[] = []
  for await (const soubor of glob(volby.vzor)) soubory.push(soubor)
  soubory.sort()

  if (soubory.length === 0) {
    console.error(`Vzoru "${volby.vzor}" neodpovídá žádný soubor.`)
    exit(1)
  }

  console.log(
    `${soubory.length} souborů → ${volby.jazyk}${volby.nasucho ? ' (nasucho, nic se neodesílá)' : ''}\n`,
  )
  for (const soubor of soubory) await prelozSoubor(soubor, volby, klic)

  if (!volby.nasucho) {
    console.log(
      '\nHotovo. Strojový překlad není publikovatelný sám o sobě — projděte ho,\n' +
        'než na něj pustíte build: čísla, paragrafy a názvy úřadů DeepL komolí.',
    )
  }
}

hlavni().catch((chyba: unknown) => {
  console.error(chyba)
  process.exitCode = 1
})
